import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

interface QuestionType {
  type: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

const questionTypeOptions = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems'
];

export default function CreateAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Science',
    className: '8th',
    dueDate: '',
    timeAllowed: 45,
    questionTypes: [{ type: 'Short Questions', numberOfQuestions: 5, marksPerQuestion: 2 }] as QuestionType[],
    additionalInstructions: '',
  });

  const addQuestionType = () => {
    setFormData({
      ...formData,
      questionTypes: [...formData.questionTypes, { type: 'Short Questions', numberOfQuestions: 0, marksPerQuestion: 0 }]
    });
  };

  const removeQuestionType = (index: number) => {
    const newTypes = formData.questionTypes.filter((_, i) => i !== index);
    setFormData({ ...formData, questionTypes: newTypes });
  };

  const updateQuestionType = (index: number, field: keyof QuestionType, value: string | number) => {
    const newTypes = [...formData.questionTypes];
    newTypes[index] = { ...newTypes[index], [field]: value };
    setFormData({ ...formData, questionTypes: newTypes });
  };

  const calculateTotals = () => {
    let totalQuestions = 0;
    let totalMarks = 0;
    formData.questionTypes.forEach(qt => {
      totalQuestions += qt.numberOfQuestions;
      totalMarks += qt.numberOfQuestions * qt.marksPerQuestion;
    });
    return { totalQuestions, totalMarks };
  };

  const { totalQuestions, totalMarks } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (totalQuestions === 0) {
      alert('Please add at least one question type');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create assignment
      const response = await axios.post('/api/assignments', {
        title: formData.title,
        description: `${formData.subject} - ${formData.className}`,
        dueDate: formData.dueDate,
        questionTypes: formData.questionTypes,
        additionalInstructions: formData.additionalInstructions,
      });
      
      if (response.data.success) {
        const assignmentId = response.data.data._id;
        
        // Start AI generation
        await axios.post('/api/generate', {
          assignmentId,
          formData: {
            subject: formData.subject,
            className: formData.className,
            timeAllowed: formData.timeAllowed,
            totalMarks,
            questionTypes: formData.questionTypes,
            additionalInstructions: formData.additionalInstructions,
          }
        });
        
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-indigo-600">VedaAI</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Assignment</h1>
        <p className="text-gray-600 mb-8">Set up a new assignment for your students</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Assignment Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Assignment Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Quiz on Electricity"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Allowed (minutes)</label>
                  <input
                    type="number"
                    value={formData.timeAllowed}
                    onChange={(e) => setFormData({ ...formData, timeAllowed: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Types */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Question Types</h2>
            
            {formData.questionTypes.map((qt, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={qt.type}
                    onChange={(e) => updateQuestionType(index, 'type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {questionTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="# Questions"
                    value={qt.numberOfQuestions || ''}
                    onChange={(e) => updateQuestionType(index, 'numberOfQuestions', parseInt(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Marks each"
                    value={qt.marksPerQuestion || ''}
                    onChange={(e) => updateQuestionType(index, 'marksPerQuestion', parseInt(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {formData.questionTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestionType(index)}
                    className="mt-2 text-red-600 text-sm hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addQuestionType}
              className="text-indigo-600 text-sm hover:text-indigo-800"
            >
              + Add Question Type
            </button>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Questions: {totalQuestions}</span>
                <span className="font-medium">Total Marks: {totalMarks}</span>
              </div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information (For better output)
            </label>
            <textarea
              rows={4}
              value={formData.additionalInstructions}
              onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Generate a question paper for 3 hour exam duration covering chapters 1-5..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between">
            <Link
              href="/"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}