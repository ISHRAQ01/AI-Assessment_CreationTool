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

// Helper to normalize difficulty to valid enum values
function normalizeDifficulty(difficulty: string): 'Easy' | 'Moderate' | 'Challenging' {
  const lower = difficulty.toLowerCase();
  if (lower === 'easy') return 'Easy';
  if (lower === 'moderate' || lower === 'medium') return 'Moderate';
  if (lower === 'challenging' || lower === 'hard') return 'Challenging';
  return 'Moderate';
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
                difficulty: normalizeDifficulty(q.difficulty || 'Moderate'),
                marks: q.marks || 2,
              })),
          }));
      }

      if (validSections.length === 0) throw new Error('No valid sections generated');

      console.log(`Valid sections: ${validSections.length}`);
      console.log(`Total questions: ${validSections.reduce((sum, s) => sum + s.questions.length, 0)}`);

      // ============================================================
      // 🔧 PARSE AI's ANSWER KEY
      // ============================================================
      let aiAnswers: Map<number, string> = new Map();
      
      if (generated.answerKey) {
        const cleanKey = generated.answerKey.replace(/\\n/g, '\n');
        const lines = cleanKey.split('\n');
        for (const line of lines) {
          const match = line.match(/^(\d+)\.\s+(.+)$/);
          if (match) {
            const qNum = parseInt(match[1]);
            let answer = match[2].trim();
            answer = answer.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
            aiAnswers.set(qNum, answer);
          }
        }
        console.log(`📋 Retrieved ${aiAnswers.size} answers from AI`);
      }

      // ============================================================
      // 🔧 Generate SECTION-WISE Answer Key with proper dividers
      // ============================================================
      let sectionWiseAnswerKey = '';
      let globalQuestionNumber = 1;

      for (let s = 0; s < validSections.length; s++) {
        const section = validSections[s];
        const isMcqSection = section.title.toLowerCase().includes('multiple choice');
        
        // Add section header
        sectionWiseAnswerKey += `\n${'='.repeat(60)}\n`;
        sectionWiseAnswerKey += `${section.title}\n`;
        sectionWiseAnswerKey += `${'='.repeat(60)}\n`;
        
        for (let q = 0; q < section.questions.length; q++) {
          const question = section.questions[q];
          let answer = '';
          
          // Get answer from AI's answerKey
          if (aiAnswers.has(globalQuestionNumber)) {
            answer = aiAnswers.get(globalQuestionNumber) || '';
          }
          
          // For MCQ, try to extract from question text if not found
          if (!answer && isMcqSection) {
            const answerMatch = question.text.match(/\[Answer:\s*([A-D])\]/i);
            if (answerMatch) {
              answer = answerMatch[1];
            }
          }
          
          // Final fallback
          if (!answer) {
            answer = 'Answer not available';
          }
          
          sectionWiseAnswerKey += `${q + 1}. ${answer}\n`;
          globalQuestionNumber++;
        }
        
        // Add empty line between sections
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