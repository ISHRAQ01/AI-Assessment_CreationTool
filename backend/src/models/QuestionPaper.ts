import mongoose, { Schema, Document } from 'mongoose';

interface IQuestion {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  subject: string;
  className: string;
  timeAllowed: number;
  maxMarks: number;
  sections: ISection[];
  answerKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Moderate', 'Challenging'], 
    default: 'Moderate' 
  },
  marks: { type: Number, required: true },
  options: { type: [String], default: undefined },
  correctAnswer: { type: String, default: undefined },
}, { _id: true });

const SectionSchema = new Schema({
  title: { type: String, required: true },
  instruction: { type: String, default: 'Attempt all questions' },
  questions: [QuestionSchema],
}, { _id: true });

const QuestionPaperSchema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  timeAllowed: { type: Number, default: 45 },
  maxMarks: { type: Number, required: true },
  sections: [SectionSchema],
  answerKey: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
