import { Request, Response } from 'express';
import Assignment, { IAssignment, IQuestionType } from '../models/Assignment';


export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, questionTypes, additionalInstructions } = req.body;
    
    // Calculate totals
    let totalQuestions = 0;
    let totalMarks = 0;
    if (questionTypes && Array.isArray(questionTypes)) {
      questionTypes.forEach((qt: IQuestionType) => {
        totalQuestions += qt.numberOfQuestions;
        totalMarks += qt.numberOfQuestions * qt.marksPerQuestion;
      });
    }
    
    const newAssignment = new Assignment({
      title,
      description,
      dueDate: new Date(dueDate),
      questionTypes: questionTypes || [],
      totalQuestions,
      totalMarks,
      additionalInstructions,
      status: 'draft'
    });
    
    const saved = await newAssignment.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id).populate('generatedPaperId');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Assignment.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Assignment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};