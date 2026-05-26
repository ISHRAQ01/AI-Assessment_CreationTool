import express from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} from '../controllers/AssignmentController';

const router = express.Router();

router.post('/', createAssignment);
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

export default router;