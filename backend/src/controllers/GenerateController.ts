import { Request, Response } from 'express';
import generationQueue from '../queues/GenerationQueue';
import Assignment from '../models/Assignment';

export const startGeneration = async (req: Request, res: Response) => {
  try {
    const { assignmentId, formData } = req.body;

    // Verify assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Add job to queue
    const job = await generationQueue.add('generate-paper', {
      assignmentId,
      formData,
    });

    res.status(202).json({
      success: true,
      message: 'Generation started',
      jobId: job.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await generationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const state = await job.getState();
    res.status(200).json({
      success: true,
      status: state,
      result: job.returnvalue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};