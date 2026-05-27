import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Trash2, Calendar, Clock, FileText, 
  BookOpen, Sparkles, CheckCircle, AlertCircle, Loader2,
  HelpCircle, ChevronRight, Zap, Layers, Target
} from 'lucide-react';

interface QuestionType {
  type: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

const questionTypeOptions = [
  { value: 'Multiple Choice Questions', icon: '🔘', desc: 'Students select from given options' },
  { value: 'Short Questions', icon: '📝', desc: 'Brief written answers' },
  { value: 'Diagram/Graph-Based Questions', icon: '📊', desc: 'Visual interpretation' },
  { value: 'Numerical Problems', icon: '🔢', desc: 'Mathematical calculations' },
];

export default function CreateAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
      const response = await axios.post('/api/assignments', {
        title: formData.title,
        description: `${formData.subject} - ${formData.className}`,
        dueDate: formData.dueDate,
        questionTypes: formData.questionTypes,
        additionalInstructions: formData.additionalInstructions,
      });
      
      if (response.data.success) {
        const assignmentId = response.data.data._id;
        
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
             <img 
      src="/icon.png" 
      alt="Profile" 
      className="rounded-full object-cover shadow-md"
      style={{ width: '32px', height: '32px' }}
    />
              
              <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">VedaAI</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles size={14} className="text-orange-400" />
              <span>AI-Powered Assignment Creator</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium mb-4">
            <Zap size={12} />
            Smart Generation
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
            Create New Assignment
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Set up your assignment and let AI generate intelligent question papers tailored to your needs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Assignment Details Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-200 to-amber-200 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 blur" />
            <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <img 
      src="/icon.png" 
      alt="Profile" 
      className="rounded-full object-cover shadow-md"
      style={{ width: '32px', height: '32px' }}
    />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Assignment Details</h2>
                  <p className="text-sm text-gray-400">Basic information about your assignment</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all duration-200
                      ${focusedField === 'title' 
                        ? 'border-orange-400 ring-2 ring-orange-100' 
                        : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder="e.g., Quiz on Electricity"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class/Grade</label>
                    <input
                      type="text"
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      Due Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      Time Allowed (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.timeAllowed}
                      onChange={(e) => setFormData({ ...formData, timeAllowed: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question Types Card */}
          <div className="group relative">
            <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                  <Layers size={18} className="text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Question Types</h2>
                  <p className="text-sm text-gray-400">Configure question distribution and marks</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {formData.questionTypes.map((qt, index) => {
                  const option = questionTypeOptions.find(opt => opt.value === qt.type);
                  return (
                    <div key={index} className="group/item relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl opacity-0 group-hover/item:opacity-100 transition" />
                      <div className="relative bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="relative">
                            <select
                              value={qt.type}
                              onChange={(e) => updateQuestionType(index, 'type', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 appearance-none bg-white cursor-pointer"
                            >
                              {questionTypeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.icon} {opt.value}
                                </option>
                              ))}
                            </select>
                            {option && (
                              <p className="text-xs text-gray-400 mt-1 ml-1">{option.desc}</p>
                            )}
                          </div>
                          <input
                            type="number"
                            placeholder="# Questions"
                            value={qt.numberOfQuestions || ''}
                            onChange={(e) => updateQuestionType(index, 'numberOfQuestions', parseInt(e.target.value) || 0)}
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          />
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="Marks each"
                              value={qt.marksPerQuestion || ''}
                              onChange={(e) => updateQuestionType(index, 'marksPerQuestion', parseInt(e.target.value) || 0)}
                              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            />
                          </div>
                        </div>
                        {formData.questionTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestionType(index)}
                            className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <button
                  type="button"
                  onClick={addQuestionType}
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors mt-2 group"
                >
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition">
                    <Plus size={12} className="text-orange-500" />
                  </div>
                  Add Question Type
                </button>

                {/* Summary Banner */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-500">Total Questions:</span>
                        <span className="text-lg font-bold text-gray-800">{totalQuestions}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-500">Total Marks:</span>
                        <span className="text-lg font-bold text-gray-800">{totalMarks}</span>
                      </div>
                    </div>
                    {totalMarks > 0 && (
                      <div className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        Ready for AI generation
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Instructions Card */}
          <div className="group relative">
            <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <HelpCircle size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Additional Information</h2>
                  <p className="text-sm text-gray-400">Help AI generate better questions</p>
                </div>
              </div>
              
              <textarea
                rows={4}
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                placeholder="e.g., Generate a question paper for 3 hour exam duration covering chapters 1-5, include questions from real-life applications..."
              />
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Sparkles size={10} />
                AI will use this context to generate more relevant questions
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <ArrowLeft size={16} />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Assignment...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Create Assignment
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}