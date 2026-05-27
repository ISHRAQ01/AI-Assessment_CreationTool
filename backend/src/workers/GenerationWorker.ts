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

// Helper: Calculate numerical answers
function calculateNumericalAnswer(questionText: string): string {
  const lowerText = questionText.toLowerCase();
  
  // Matrix determinant 2x2: [[a, b], [c, d]] => ad - bc
  const matrixDetMatch = lowerText.match(/determinant.*?\[\[(\d+),\s*(\d+)\],\s*\[(\d+),\s*(\d+)\]\]/i);
  if (matrixDetMatch) {
    const a = parseInt(matrixDetMatch[1]);
    const b = parseInt(matrixDetMatch[2]);
    const c = parseInt(matrixDetMatch[3]);
    const d = parseInt(matrixDetMatch[4]);
    const result = (a * d) - (b * c);
    return `${result}`;
  }
  
  // Matrix inverse 2x2: [[a, b], [c, d]]
  const matrixInvMatch = lowerText.match(/inverse.*?\[\[(\d+),\s*(\d+)\],\s*\[(\d+),\s*(\d+)\]\]/i);
  if (matrixInvMatch) {
    const a = parseInt(matrixInvMatch[1]);
    const b = parseInt(matrixInvMatch[2]);
    const c = parseInt(matrixInvMatch[3]);
    const d = parseInt(matrixInvMatch[4]);
    const det = (a * d) - (b * c);
    if (det !== 0) {
      return `[${d/det}, ${-b/det}; ${-c/det}, ${a/det}]`;
    }
    return "Matrix is singular (determinant = 0), inverse does not exist";
  }
  
  // Matrix rank
  const rankMatch = lowerText.match(/rank.*?\[\[(\d+),\s*(\d+)\],\s*\[(\d+),\s*(\d+)\]\]/i);
  if (rankMatch) {
    const a = parseInt(rankMatch[1]);
    const b = parseInt(rankMatch[2]);
    const c = parseInt(rankMatch[3]);
    const d = parseInt(rankMatch[4]);
    const det = (a * d) - (b * c);
    if (det !== 0) return "2 (full rank)";
    if (a !== 0 || b !== 0 || c !== 0 || d !== 0) return "1";
    return "0";
  }
  
  // Linear equation: 2x + 5 = 11
  const equationMatch = lowerText.match(/(\d+)x\s*\+\s*(\d+)\s*=\s*(\d+)/i);
  if (equationMatch) {
    const a = parseInt(equationMatch[1]);
    const b = parseInt(equationMatch[2]);
    const c = parseInt(equationMatch[3]);
    const result = (c - b) / a;
    return `x = ${result}`;
  }
  
  // Simple equation: x + 5 = 10
  const simpleEqMatch = lowerText.match(/x\s*\+\s*(\d+)\s*=\s*(\d+)/i);
  if (simpleEqMatch) {
    const b = parseInt(simpleEqMatch[1]);
    const c = parseInt(simpleEqMatch[2]);
    const result = c - b;
    return `x = ${result}`;
  }
  
  // Area of rectangle
  const rectMatch = lowerText.match(/rectangle.*?(\d+).*?(\d+)/i);
  if (rectMatch && lowerText.includes('area')) {
    const l = parseFloat(rectMatch[1]);
    const w = parseFloat(rectMatch[2]);
    return `${l * w} square units`;
  }
  
  // Speed calculation
  const speedMatch = lowerText.match(/(\d+)\s*(?:km|kilometers).*?(\d+)\s*(?:hours?|h)/i);
  if (speedMatch && (lowerText.includes('speed') || lowerText.includes('average speed'))) {
    const distance = parseFloat(speedMatch[1]);
    const time = parseFloat(speedMatch[2]);
    return `${distance / time} km/h`;
  }
  
  // Volume of box
  const volumeMatch = lowerText.match(/box.*?(\d+).*?(\d+).*?(\d+)/i);
  if (volumeMatch && lowerText.includes('volume')) {
    const l = parseFloat(volumeMatch[1]);
    const w = parseFloat(volumeMatch[2]);
    const h = parseFloat(volumeMatch[3]);
    return `${l * w * h} cubic units`;
  }
  
  return `[Calculate: ${questionText.substring(0, 100)}]`;
}

// Helper: Generate short answer
function generateShortAnswer(questionText: string, subject: string): string {
  const lowerText = questionText.toLowerCase();
  
  if (lowerText.includes('matrix')) {
    if (lowerText.includes('determinant')) {
      return `The determinant is a scalar value that can be computed from a square matrix. For a 2x2 matrix [[a, b], [c, d]], the determinant is ad - bc.`;
    }
    if (lowerText.includes('inverse')) {
      return `The inverse of a matrix A is a matrix A⁻¹ such that A × A⁻¹ = I (identity matrix). For a 2x2 matrix [[a, b], [c, d]] with determinant ≠ 0, the inverse is (1/det) × [[d, -b], [-c, a]].`;
    }
    if (lowerText.includes('rank')) {
      return `The rank of a matrix is the maximum number of linearly independent rows or columns. It indicates the dimension of the vector space spanned by the matrix.`;
    }
    if (lowerText.includes('nullity')) {
      return `Nullity is the dimension of the null space of a matrix. By the rank-nullity theorem: rank + nullity = number of columns.`;
    }
  }
  
  if (lowerText.includes('linear equation') || lowerText.includes('equation')) {
    return `A linear equation is an equation where variables appear only to the first power. For example, 2x + 5 = 11 solves to x = 3.`;
  }
  
  return `Answer: ${questionText.substring(0, 80)}... (Teacher to evaluate based on course material)`;
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
      // 🔧 Generate Answer Key with calculated answers
      // ============================================================
      let sectionWiseAnswerKey = '';

      for (let s = 0; s < validSections.length; s++) {
        const section = validSections[s];
        const isMcqSection = section.title.toLowerCase().includes('multiple choice');
        const isShortSection = section.title.toLowerCase().includes('short');
        const isNumericalSection = section.title.toLowerCase().includes('numerical');
        
        sectionWiseAnswerKey += `\n${'='.repeat(60)}\n`;
        sectionWiseAnswerKey += `${section.title}\n`;
        sectionWiseAnswerKey += `${'='.repeat(60)}\n`;
        
        for (let q = 0; q < section.questions.length; q++) {
          const question = section.questions[q];
          let answer = '';
          
          if (isMcqSection) {
            const answerMatch = question.text.match(/\[Answer:\s*([A-D])\]/i);
            answer = answerMatch ? answerMatch[1] : 'Refer to question options';
          } 
          else if (isNumericalSection) {
            answer = calculateNumericalAnswer(question.text);
          }
          else if (isShortSection) {
            answer = generateShortAnswer(question.text, formData.subject);
          }
          else {
            answer = `Answer to question ${q+1}`;
          }
          
          sectionWiseAnswerKey += `${q + 1}. ${answer}\n`;
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