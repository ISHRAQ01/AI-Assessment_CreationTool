import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Enhanced store with better type safety and optional persistence
interface AssignmentStore {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
  
  // Actions
  setAssignments: (assignments: Assignment[]) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Computed/helper getters
  getAssignmentsByStatus: (status: Assignment['status']) => Assignment[];
  getTotalCount: () => number;
  getCompletedCount: () => number;
  getGeneratingCount: () => number;
  getFailedCount: () => number;
  getDraftCount: () => number;
}

export const useAssignmentStore = create<AssignmentStore>()(
  // Optional: add persistence to save state in localStorage
  // Remove the persist wrapper if you don't want persistence
  (set, get) => ({
    // State
    assignments: [],
    currentAssignment: null,
    isLoading: false,
    error: null,
    lastFetched: null,
    
    // Basic Actions
    setAssignments: (assignments) => set({ 
      assignments, 
      lastFetched: new Date(),
      error: null 
    }),
    
    setCurrentAssignment: (assignment) => set({ 
      currentAssignment: assignment,
      error: null 
    }),
    
    addAssignment: (assignment) => set((state) => ({ 
      assignments: [assignment, ...state.assignments],
      error: null
    })),
    
    updateAssignment: (id, updates) => set((state) => ({
      assignments: state.assignments.map((a) => 
        a._id === id ? { ...a, ...updates } : a
      ),
      currentAssignment: state.currentAssignment?._id === id 
        ? { ...state.currentAssignment, ...updates } 
        : state.currentAssignment,
      error: null
    })),
    
    deleteAssignment: (id) => set((state) => ({
      assignments: state.assignments.filter((a) => a._id !== id),
      currentAssignment: state.currentAssignment?._id === id ? null : state.currentAssignment,
      error: null
    })),
    
    setIsLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ error }),
    
    clearError: () => set({ error: null }),
    
    reset: () => set({
      assignments: [],
      currentAssignment: null,
      isLoading: false,
      error: null,
      lastFetched: null
    }),
    
    // Computed Getters
    getAssignmentsByStatus: (status) => {
      return get().assignments.filter(a => a.status === status);
    },
    
    getTotalCount: () => {
      return get().assignments.length;
    },
    
    getCompletedCount: () => {
      return get().assignments.filter(a => a.status === 'completed').length;
    },
    
    getGeneratingCount: () => {
      return get().assignments.filter(a => a.status === 'generating').length;
    },
    
    getFailedCount: () => {
      return get().assignments.filter(a => a.status === 'failed').length;
    },
    
    getDraftCount: () => {
      return get().assignments.filter(a => a.status === 'draft').length;
    },
  })
);