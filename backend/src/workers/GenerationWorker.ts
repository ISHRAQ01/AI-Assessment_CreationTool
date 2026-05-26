import { Worker } from 'bullmq';
import redisClient from '../config/Redis';
import Redis from 'ioredis';
import Assignment from '../models/Assignment';
import QuestionPaper from '../models/QuestionPaper';
import { generateQuestionPaper } from '../services/AiService';

// Separate Redis client for pub/sub
const redisPub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const JOB_COMPLETION_CHANNEL = 'job:completed';

const worker = new Worker(
  'question-generation',
  async (job) => {
    console.log(`Processing job ${job.id}`);
    const { assignmentId, formData } = job.data;

    try {
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' });
      const generated = await generateQuestionPaper(formData);
      
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
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        generatedPaperId: saved._id,
      });

      // Publish completion event for WebSocket
      await redisPub.publish(JOB_COMPLETION_CHANNEL, JSON.stringify({
        type: 'GENERATION_COMPLETED',
        assignmentId,
        questionPaperId: saved._id,
        status: 'completed',
      }));

      return { questionPaperId: saved._id };
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
      
      // Publish failure event
      await redisPub.publish(JOB_COMPLETION_CHANNEL, JSON.stringify({
        type: 'GENERATION_FAILED',
        assignmentId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      
      throw error;
    }
  },
  { connection: redisClient }
);

console.log('✅ Generation worker started');

export default worker;