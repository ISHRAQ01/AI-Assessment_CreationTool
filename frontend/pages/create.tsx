import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Trash2, Calendar, Clock, FileText, 
  BookOpen, Sparkles, CheckCircle, AlertCircle, Loader2,
  HelpCircle, ChevronRight, Zap, Layers, Target, Upload, X, File,
  Home, Users, Wrench, Library, Settings, Minus, ChevronDown
} from 'lucide-react';

interface QuestionType {
  type: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

const questionTypeOptions = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Answer Questions',
  'Fill in the Blanks',
];

// Stepper Component
function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-1 py-0.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600"
      >
        <Minus size={11} />
      </button>
      <span className="w-6 text-center text-sm font-semibold text-gray-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

export default function CreateAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Science',
    className: '8th',
    dueDate: '',
    timeAllowed: 45,
    questionTypes: [] as QuestionType[],
    additionalInstructions: '',
  });

  const addQuestionType = () => {
    setFormData({
      ...formData,
      questionTypes: [...formData.questionTypes, { type: 'Multiple Choice Questions', numberOfQuestions: 1, marksPerQuestion: 1 }]
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileRead(files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0]);
    }
  };

  const extractPdfTextSimple = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const text = new TextDecoder().decode(arrayBuffer);
          const matches = text.match(/[A-Za-z0-9\s,\.\-\'\"]{20,}/g);
          const extracted = matches ? matches.join(' ').substring(0, 4000) : `[PDF file: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`;
          resolve(extracted);
        } catch (err) {
          resolve(`[PDF file: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileRead = async (file: File) => {
    setUploadedFile(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const extractedTitle = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    let extractedSubject = formData.subject;
    const subjectKeywords = ['Math', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Hindi', 'Sanskrit'];
    for (const keyword of subjectKeywords) {
      if (fileName.toLowerCase().includes(keyword.toLowerCase())) {
        extractedSubject = keyword;
        break;
      }
    }
    let content = '';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        content = event.target?.result as string;
        setFileContent(content);
        setFormData(prev => ({
          ...prev,
          title: prev.title || extractedTitle,
          subject: extractedSubject,
        }));
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const extractedText = await extractPdfTextSimple(file);
      content = extractedText;
      setFileContent(content);
      setFormData(prev => ({
        ...prev,
        title: prev.title || extractedTitle,
        subject: extractedSubject,
      }));
      alert(`PDF "${fileName}" loaded! Content extracted for AI.`);
    } else {
      setFileContent(`[File uploaded: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`);
      setFormData(prev => ({
        ...prev,
        title: prev.title || extractedTitle,
        subject: extractedSubject,
      }));
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileContent('');
  };

  const calculateTotals = () => {
    let totalQuestions = 0;
    let totalMarks = 0;
    formData.questionTypes.forEach(qt => {
      totalQuestions += qt.numberOfQuestions;
      totalMarks += (qt.numberOfQuestions * qt.marksPerQuestion);
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
    let finalInstructions = formData.additionalInstructions;
    if (uploadedFile && fileContent && fileContent.length > 100) {
      finalInstructions = `IMPORTANT: You are an expert exam question generator. Generate questions based ONLY on the following content from "${uploadedFile.name}".

--- FILE CONTENT START ---
${fileContent.substring(0, 4000)}
--- FILE CONTENT END ---

STRICT RULES:
1. Generate questions ONLY from topics in the above content
2. Do NOT invent questions about topics not mentioned in the file
3. Subject: ${formData.subject}
4. Class/Grade: ${formData.className}

${formData.additionalInstructions ? `\nAdditional user instructions: ${formData.additionalInstructions}` : ''}`;
    }
    const hasMCQ = formData.questionTypes.some(qt => qt.type === 'Multiple Choice Questions');
    if (hasMCQ) {
      finalInstructions += `

╔══════════════════════════════════════════════════════════════╗
║           IMPORTANT: MULTIPLE CHOICE QUESTION FORMAT         ║
╚══════════════════════════════════════════════════════════════╝

For EVERY Multiple Choice Question, you MUST follow this EXACT format:

Question: [Your question text here]?
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
[Answer: X] where X is A, B, C, or D

EXAMPLE:
Question: What is the capital of France?
A) London
B) Berlin
C) Paris
D) Madrid
[Answer: C]

DO NOT use bold, markdown, or any special formatting.
Each MCQ MUST have exactly 4 options (A, B, C, D).
The correct answer MUST be indicated as [Answer: X] at the end.

Generate ${formData.questionTypes.find(qt => qt.type === 'Multiple Choice Questions')?.numberOfQuestions || 5} Multiple Choice Questions based on the file content.`;
    }
    const hasShort = formData.questionTypes.some(qt => qt.type === 'Short Questions');
    if (hasShort) {
      finalInstructions += `\n\nFor Short Questions, generate clear, concise questions that require 2-3 sentence answers.`;
    }
    const hasDiagram = formData.questionTypes.some(qt => qt.type === 'Diagram/Graph-Based Questions');
    if (hasDiagram) {
      finalInstructions += `\n\nFor Diagram/Graph-Based Questions, describe what diagram or graph students need to draw or interpret.`;
    }
    const hasNumerical = formData.questionTypes.some(qt => qt.type === 'Numerical Problems');
    if (hasNumerical) {
      finalInstructions += `\n\nFor Numerical Problems, provide clear problem statements with necessary data.`;
    }
    finalInstructions += `\n\nTotal Questions to Generate: ${totalQuestions} (${formData.questionTypes.map(qt => `${qt.numberOfQuestions} ${qt.type}`).join(', ')})`;
    finalInstructions += `\nTotal Marks: ${totalMarks}`;
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/assignments`, {
        title: formData.title,
        description: `${formData.subject} - ${formData.className}`,
        dueDate: formData.dueDate,
        questionTypes: formData.questionTypes,
        additionalInstructions: finalInstructions,
      });
      if (response.data.success) {
        const assignmentId = response.data.data._id;
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/generate`, {
          assignmentId,
          formData: {
            title: formData.title,
            subject: formData.subject,
            className: formData.className,
            timeAllowed: formData.timeAllowed,
            totalMarks,
            questionTypes: formData.questionTypes,
            additionalInstructions: finalInstructions,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">V</span>
              </div>
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                  <FileText size={18} className="text-white" />
                </div>
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class/Grade</label>
                    <input
                      type="text"
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <Upload size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600">Choose a file or drag & drop it here</p>
            <p className="text-xs text-gray-400 mt-1">TXT or PDF files recommended</p>
            
            <input
              id="fileInput"
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button type="button" className="mt-4 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-50 transition">
              Browse Files
            </button>
            
            {uploadedFile && (
              <div className="mt-4 flex items-center justify-between bg-white rounded-lg p-3 border max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <File size={20} className="text-orange-500" />
                  <div className="text-left">
                    <p className="text-sm text-gray-700 truncate max-w-[200px]">{uploadedFile.name}</p>
                    <p className="text-xs text-green-600">
                      {fileContent && fileContent.length > 100 
                        ? `✓ ${(fileContent.length / 1000).toFixed(1)}KB content extracted`
                        : `✓ File ready`}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }} className="text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-200">
              Upload a document to provide context for AI question generation
            </p>
          </div>

          {/* Question Types Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                <Layers size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Question Types</h2>
                <p className="text-sm text-gray-400">Configure question distribution and marks</p>
              </div>
            </div>

            <div className="space-y-4">
              {formData.questionTypes.map((qt, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-5">
                      <select
                        value={qt.type}
                        onChange={(e) => updateQuestionType(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {questionTypeOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Stepper 
                        value={qt.numberOfQuestions} 
                        onChange={(v) => updateQuestionType(index, 'numberOfQuestions', v)} 
                      />
                    </div>
                    <div className="col-span-3">
                      <Stepper 
                        value={qt.marksPerQuestion} 
                        onChange={(v) => updateQuestionType(index, 'marksPerQuestion', v)} 
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {formData.questionTypes.length > 1 && (
                        <button type="button" onClick={() => removeQuestionType(index)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuestionType}
              className="mt-4 flex items-center gap-2 text-orange-500 text-sm hover:text-orange-600 font-medium"
            >
              <Plus size={14} />
              Add Question Type
            </button>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
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

          {/* Additional Instructions Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="e.g., Generate a question paper for 3 hour exam duration covering chapters 1-5, include questions from real-life applications..."
            />
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Sparkles size={10} />
              AI will use this context to generate more relevant questions
            </p>
          </div>

          {/* AI Generation Info Banner */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" />
              <span className="text-sm font-semibold text-orange-700">AI-Powered Generation</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Our AI will analyze your inputs and generate a complete question paper with sections, difficulty levels, and answer key.
              For MCQ questions, 4 options will be provided with correct answer indicated.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200"
            >
              <ArrowLeft size={16} />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Assignment...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Create & Generate Paper
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