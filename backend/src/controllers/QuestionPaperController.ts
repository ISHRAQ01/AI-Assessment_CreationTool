import { Request, Response } from 'express';
import mongoose from 'mongoose';
import QuestionPaper from '../models/QuestionPaper';

export const getQuestionPaperById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Convert string to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);
    const paper = await QuestionPaper.findById(objectId);
    
    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }
    
    res.status(200).json({ success: true, data: paper });
  } catch (error) {
    console.error('Error fetching question paper:', error);
    res.status(500).json({ success: false, message: 'Invalid ID format or server error' });
  }
};