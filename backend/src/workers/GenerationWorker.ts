import { Worker } from 'bullmq';
import redisClient from '../config/Redis';
import Assignment from '../models/Assignment';
import QuestionPaper, { IQuestionPaper } from '../models/QuestionPaper';
import { generateQuestionPaper } from '../services/AiService';

const worker = new Worker(
  'question-generation',
  async (job) => {
    console.log(`Processing job ${job.id}`);
    const { assignmentId, formData } = job.data;

    try {
      // Update assignment status to generating
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' });

      // Generate questions using AI
      const generated = await generateQuestionPaper(formData);

      // Create question paper in database
      const questionPaper = new QuestionPaper({
        assignmentId,
        subject: formData.subject,
        className: formData.className,
        timeAllowed: formData.timeAllowed || 45,
        maxMarks: formData.totalMarks,
        sections: generated.sections,
        answerKey: generated.answerKey,
      });

      const saved = await questionPaper.save();

      // Update assignment with generated paper ID
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        generatedPaperId: saved._id,
      });

      return { questionPaperId: saved._id };
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
      throw error;
    }
  },
  { connection: redisClient }
);

console.log('✅ Generation worker started');

export default worker;