import express from 'express';
import { startGeneration, getJobStatus } from '../controllers/GenerateController';

const router = express.Router();

router.post('/', startGeneration);
router.get('/status/:jobId', getJobStatus);

export default router;