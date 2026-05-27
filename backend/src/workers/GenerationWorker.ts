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

// Helper function to generate an answer from a question
function generateAnswerFromQuestion(questionText: string, questionType: string): string {
  const lowerQuestion = questionText.toLowerCase();
  
  // For "What is..." questions
  if (lowerQuestion.includes('what is')) {
    const topic = questionText.replace(/What is/i, '').replace(/\?/g, '').trim();
    return `${topic} is a fundamental concept in ${topic.split(' ')[0]}. The specific definition depends on context. (Teacher to provide detailed answer based on course material)`;
  }
  
  // For "How do you..." questions
  if (lowerQuestion.includes('how do you')) {
    return `The process involves several steps. (Teacher to provide the specific method based on course material)`;
  }
  
  // For mathematical concepts
  if (lowerQuestion.includes('matrix') || lowerQuestion.includes('vector') || lowerQuestion.includes('linear')) {
    return `This is a key concept in linear algebra. The answer involves understanding the mathematical properties and relationships. (Teacher to provide detailed explanation)`;
  }
  
  // Default intelligent fallback
  return `Answer to: "${questionText.substring(0, 100)}..." (Teacher to provide detailed answer based on course material and marking scheme)`;
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
            
            // Check if this is a placeholder answer
            const isPlaceholder = answer.includes('Model answer for') || 
                                  answer.includes('Teacher should provide') ||
                                  answer.includes('should be provided by teacher');
            
            if (!answerMap.has(qNum) && !isPlaceholder) {
              answerMap.set(qNum, answer);
            }
          }
        }
        console.log(`📋 Parsed ${answerMap.size} real answers from AI response`);
      }

      // ============================================================
      // 🔧 Generate SECTION-WISE Answer Key with intelligent answers
      // ============================================================
      let sectionWiseAnswerKey = '';
      let globalQuestionNumber = 1;

      for (let s = 0; s < validSections.length; s++) {
        const section = validSections[s];
        const isMcqSection = section.title.toLowerCase().includes('multiple choice');
        const isShortSection = section.title.toLowerCase().includes('short');
        const isNumericalSection = section.title.toLowerCase().includes('numerical');
        const isDiagramSection = section.title.toLowerCase().includes('diagram') || section.title.toLowerCase().includes('graph');
        
        sectionWiseAnswerKey += `\n${'='.repeat(60)}\n`;
        sectionWiseAnswerKey += `${section.title}\n`;
        sectionWiseAnswerKey += `${'='.repeat(60)}\n`;
        
        for (let q = 0; q < section.questions.length; q++) {
          const question = section.questions[q];
          let answer = '';
          
          // Try to get answer from AI's answerKey
          if (answerMap.has(globalQuestionNumber)) {
            answer = answerMap.get(globalQuestionNumber) || '';
          }
          
          // For MCQ: Extract answer from question text
          if ((!answer || answer.length > 2) && isMcqSection) {
            const answerMatch = question.text.match(/\[Answer:\s*([A-D])\]/i);
            if (answerMatch) {
              answer = answerMatch[1];
            }
          }
          
          // For Short Questions: Generate intelligent answer if missing
          if ((!answer || answer.includes('Model answer for') || answer.includes('Teacher should provide')) && isShortSection) {
            answer = generateAnswerFromQuestion(question.text, 'short');
          }
          
          // For Numerical: Generate note if missing
          if ((!answer || answer === 'A' || answer.length < 3) && isNumericalSection) {
            answer = `[Numerical answer to be calculated: ${question.text.substring(0, 80)}...]`;
          }
          
          // For Diagram: Generate description if missing
          if ((!answer || answer === 'A' || answer.length < 5) && isDiagramSection) {
            answer = `[Diagram should illustrate: ${question.text.substring(0, 80)}...]`;
          }
          
          // Final fallback
          if (!answer) {
            if (isMcqSection) {
              answer = 'Correct option as indicated in question';
            } else if (isNumericalSection) {
              answer = 'Calculate using standard formula';
            } else if (isDiagramSection) {
              answer = 'Draw as described in question';
            } else {
              answer = `Answer to question ${globalQuestionNumber} (Teacher to evaluate based on student response)`;
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