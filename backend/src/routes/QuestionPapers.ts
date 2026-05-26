import express from 'express';
import { getQuestionPaperById } from '../controllers/QuestionPaperController';

const router = express.Router();

router.get('/:id', getQuestionPaperById);

export default router;