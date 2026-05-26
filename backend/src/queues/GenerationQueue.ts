import { Queue } from 'bullmq';
import redisClient from '../config/Redis';

const generationQueue = new Queue('question-generation', {
  connection: redisClient,
});

export default generationQueue;