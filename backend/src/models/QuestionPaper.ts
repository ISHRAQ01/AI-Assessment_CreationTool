import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
}

export interface ISection {
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
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], required: true },
  marks: { type: Number, required: true, min: 1 }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true, default: [] }
});

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  timeAllowed: { type: Number, required: true, default: 45 },
  maxMarks: { type: Number, required: true },
  sections: { type: [SectionSchema], required: true, default: [] },
  answerKey: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);