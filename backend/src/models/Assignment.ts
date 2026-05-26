import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionType {
  type: string;      
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface IAssignment extends Document {
  title: string;
  description?: string;
  fileUrl?: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  generatedPaperId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  numberOfQuestions: { type: Number, required: true, min: 1 },
  marksPerQuestion: { type: Number, required: true, min: 0 }
});

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String },
  dueDate: { type: Date, required: true },
  questionTypes: { type: [QuestionTypeSchema], default: [] },
  totalQuestions: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  additionalInstructions: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'generating', 'completed', 'failed'], 
    default: 'draft' 
  },
  generatedPaperId: { type: Schema.Types.ObjectId, ref: 'QuestionPaper' }
}, { timestamps: true });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);