import { create } from 'zustand';

export interface QuestionType {
  type: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  generatedPaperId?: string;
  createdAt: string;
}

interface AssignmentStore {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isLoading: boolean;
  setAssignments: (assignments: Assignment[]) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  
  setAssignments: (assignments) => set({ assignments }),
  
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  
  addAssignment: (assignment) => set((state) => ({ 
    assignments: [assignment, ...state.assignments] 
  })),
  
  updateAssignment: (id, updates) => set((state) => ({
    assignments: state.assignments.map((a) => 
      a._id === id ? { ...a, ...updates } : a
    ),
    currentAssignment: state.currentAssignment?._id === id 
      ? { ...state.currentAssignment, ...updates } 
      : state.currentAssignment
  })),
  
  deleteAssignment: (id) => set((state) => ({
    assignments: state.assignments.filter((a) => a._id !== id)
  })),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
}));