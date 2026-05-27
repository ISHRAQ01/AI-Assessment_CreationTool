import { Worker } from 'bullmq';
import redisClient from '../config/Redis';
import Assignment from '../models/Assignment';
import QuestionPaper from '../models/QuestionPaper';
import { generateQuestionPaper } from '../services/AiService';

import Redis from 'ioredis';
const redisPublisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const JOB_COMPLETION_CHANNEL = 'job:completed';

interface IQuestion {
  text: string;
  difficulty: string;
  marks: number;
}

interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

interface IGeneratedResponse {
  sections: Array<{
    title?: string;
    instruction?: string;
    questions?: Array<{
      text?: string;
      difficulty?: string;
      marks?: number;
    }>;
  }>;
  answerKey?: string;
}

interface JobData {
  assignmentId: string;
  formData: {
    title: string;
    subject: string;
    className: string;
    timeAllowed: number;
    totalMarks: number;
    questionTypes: Array<{ type: string; numberOfQuestions: number; marksPerQuestion: number }>;
    additionalInstructions?: string;
  };
}

const worker = new Worker<JobData>(
  'question-generation',
  async (job) => {
    console.log(`Processing job ${job.id}`);
    const { assignmentId, formData } = job.data;

    try {
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' });

      const generated: IGeneratedResponse = await generateQuestionPaper(formData);
      console.log('AI Response received');

      let validSections: ISection[] = [];
      if (generated.sections && Array.isArray(generated.sections)) {
        validSections = generated.sections
          .filter((section) => section && section.questions && Array.isArray(section.questions) && section.questions.length > 0)
          .map((section) => ({
            title: section.title || 'Untitled Section',
            instruction: section.instruction || 'Attempt all questions',
            questions: (section.questions || [])
              .filter((q) => q && typeof q.text === 'string' && q.text.trim().length > 0)
              .map((q) => ({
                text: q.text?.trim() || '',
                difficulty: q.difficulty || 'Moderate',
                marks: q.marks || 2,
              })),
          }));
      }

      if (validSections.length === 0) throw new Error('No valid sections generated');

      console.log(`Valid sections: ${validSections.length}`);
      console.log(`Total questions: ${validSections.reduce((sum, s) => sum + s.questions.length, 0)}`);

      // ============================================================
      // 🔧 Parse AI's answerKey
      // ============================================================
      let answerMap: Map<number, string> = new Map();

      if (generated.answerKey) {
        let cleanAnswerKey = generated.answerKey.replace(/\\n/g, '\n');
        const lines = cleanAnswerKey.split('\n');
        
        for (const line of lines) {
          const match = line.match(/^(\d+)\.\s+(.+)$/);
          if (match) {
            const qNum = parseInt(match[1]);
            let answer = match[2].trim();
            answer = answer.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
            
            if (!answerMap.has(qNum)) {
              answerMap.set(qNum, answer);
            }
          }
        }
        console.log(`📋 Parsed ${answerMap.size} answers from AI response`);
      }

      // ============================================================
      // 🔧 Generate answer key
      // ============================================================
      let sectionWiseAnswerKey = '';
      let globalQuestionNumber = 1;

      for (let s = 0; s < validSections.length; s++) {
        const section = validSections[s];
        const isMcqSection = section.title.toLowerCase().includes('multiple choice');
        
        sectionWiseAnswerKey += `\n${'='.repeat(60)}\n`;
        sectionWiseAnswerKey += `${section.title}\n`;
        sectionWiseAnswerKey += `${'='.repeat(60)}\n`;
        
        for (let q = 0; q < section.questions.length; q++) {
          const question = section.questions[q];
          let answer = '';
          
          if (answerMap.has(globalQuestionNumber)) {
            answer = answerMap.get(globalQuestionNumber) || '';
          }
          
          if (!answer && isMcqSection) {
            const answerMatch = question.text.match(/\[Answer:\s*([A-D])\]/i);
            if (answerMatch) {
              answer = answerMatch[1];
            }
          }
          
          if (!answer) {
            if (isMcqSection) {
              answer = 'Not specified';
            } else {
              answer = 'Answer will vary. Expected key points should be provided by teacher.';
            }
          }
          
          sectionWiseAnswerKey += `${q + 1}. ${answer}\n`;
          globalQuestionNumber++;
        }
        
        sectionWiseAnswerKey += `\n`;
      }

      const finalAnswerKey = sectionWiseAnswerKey;

      const questionPaper = new QuestionPaper({
        assignmentId,
        subject: formData.subject,
        className: formData.className,
        timeAllowed: formData.timeAllowed || 45,
        maxMarks: formData.totalMarks,
        sections: validSections,
        answerKey: finalAnswerKey,
      });

      const saved = await questionPaper.save();
      console.log(`✅ Question paper saved with ID: ${saved._id}`);

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        generatedPaperId: saved._id,
      });

      const completionEvent = JSON.stringify({
        type: 'GENERATION_COMPLETED',
        assignmentId: assignmentId,
        questionPaperId: saved._id,
        status: 'completed'
      });
      
      await redisPublisher.publish(JOB_COMPLETION_CHANNEL, completionEvent);
      console.log(`📡 Published completion event for assignment ${assignmentId}`);

      return { questionPaperId: saved._id };
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
      
      const failureEvent = JSON.stringify({
        type: 'GENERATION_FAILED',
        assignmentId: assignmentId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      await redisPublisher.publish(JOB_COMPLETION_CHANNEL, failureEvent);
      
      throw error;
    }
  },
  { connection: redisClient }
);

console.log('✅ Generation worker started');

export default worker;