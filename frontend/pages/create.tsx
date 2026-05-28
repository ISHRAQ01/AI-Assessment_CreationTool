import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Calendar, Clock, FileText,
  BookOpen, Sparkles, CheckCircle, AlertCircle, Loader2,
  HelpCircle, ChevronRight, Zap, Layers, Target, Upload, X, File,
  Home, Users, Wrench, Library, Settings, Minus
} from 'lucide-react';

interface QuestionType {
  type: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

const questionTypeOptions = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Answer Questions',
  'Fill in the Blanks',
  'Jumble Sentence / Make Sentence',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'More Feature Coming [Thank You For Using VedaAi'
];

// Stepper Component with manual input support - Enhanced
function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const num = parseInt(val);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    let num = parseInt(inputValue);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    onChange(num);
    setInputValue(num.toString());
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Minus size={14} />
      </button>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="w-12 text-center text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 py-1.5"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Plus size={14} />
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
    subject: '',
    className: '',
    dueDate: '',
    timeAllowed: 0,
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

  // Extract text from PDF using simple approach
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

  // FIXED: File content is stored separately, NOT added to additionalInstructions display
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
      // For TXT files
      const reader = new FileReader();
      reader.onload = (event) => {
        content = event.target?.result as string;
        setFileContent(content); // Store separately, NOT in additionalInstructions

        // Update title and subject only, NOT additionalInstructions
        setFormData(prev => ({
          ...prev,
          title: prev.title || extractedTitle,
          subject: extractedSubject,
          // additionalInstructions remains unchanged - user can still add their own notes
        }));
      };
      reader.readAsText(file);
    }
    else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const extractedText = await extractPdfTextSimple(file);
      content = extractedText;
      setFileContent(content); // Store separately, NOT in additionalInstructions

      setFormData(prev => ({
        ...prev,
        title: prev.title || extractedTitle,
        subject: extractedSubject,
        // additionalInstructions remains unchanged
      }));

      alert(`PDF "${fileName}" loaded! Content extracted for AI.`);
    }
    else {
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

  // FIXED: File content is added ONLY during submission, not displayed in textarea
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

    // Build final instructions for AI - file content added here, NOT in display
    let finalInstructions = formData.additionalInstructions;

    // Add file content ONLY for AI submission (not shown in UI)
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

    // Check if MCQ is selected
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

    // Add instructions for other question types
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

    // Add total counts
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
    <div className="min-h-screen bg-[#F3F4F6] text-[#374151] font-sans antialiased">
      <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-900">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Assignment</span>
        </Link>

        <div className="flex items-center gap-6">

          <div className="flex items-center gap-2 border border-gray-200 rounded-full py-1 px-3 bg-gray-50">
            <img src="/avatar.png" alt="Profile" className="w-7 h-7 rounded-full object-cover" />
            <span className="text-sm font-semibold text-gray-700">John Doe</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-8 flex gap-8">

        <aside className="w-64 flex-shrink-0 flex flex-col justify-between h-[calc(100vh-120px)] sticky top-20">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 shadow-lg">
            {/* Logo Section - Enhanced */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur-md opacity-60" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                  <span className="text-orange font-bold text-xl">V</span>
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  VedaAI
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">AI Assessment Platform</p>
              </div>
            </div>

            <Link href="/create" className="w-full bg-[#2D2E32] text-black rounded-full py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-sm">
              <Plus size={16} className="text-orange-400" />
              <span>Create Assignment</span>
            </Link>

            <nav className="space-y-1">
              {[
                { name: 'Home', icon: Home, active: false, href: '/' },
                { name: 'My Groups', icon: Users, active: false, href: '/groups' },
                { name: 'Assignments', icon: FileText, active: true, href: '/assignments' },
                { name: "AI Teacher's Toolkit", icon: Wrench, active: false, href: '/toolkit' },
                { name: 'My Library', icon: Library, active: false, href: '/library' },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={item.active ? 'text-orange-600' : 'text-gray-400'} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-3 font-medium">
              <Settings size={14} />
              <span>Settings</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <img src="/avatar.png" alt="School" className="w-10 h-10 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">Delhi Public School</p>
                <p className="text-[11px] text-gray-400 truncate">Bokaro Steel City</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Form */}
        <main className="flex-1 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Create Assignment</h1>
            <p className="text-xs text-gray-400">Set up a new assignment for your students</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">

            <div>
              <h2 className="text-lg font-semibold text-gray-800">Assignment Details</h2>
              <p className="text-xs text-gray-400">Basic information about your assignment</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade</label>
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar size={14} /> Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Clock size={14} /> Time Allowed (minutes)
                </label>
                <input
                  type="number"
                  value={formData.timeAllowed}
                  onChange={(e) => setFormData({ ...formData, timeAllowed: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* File Upload Area - No longer shows content in Additional Info */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">Choose a file or drag & drop it here</p>
              <p className="text-xs text-gray-400 mt-1">TXT files recommended for best results</p>

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
                          ? `✓ ${(fileContent.length / 1000).toFixed(1)}KB content extracted (will be used for AI)`
                          : `✓ File ready`}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="mt-4 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                <p className="font-medium">📌 How it works:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Upload TXT or PDF file with your content</li>
                  <li>AI reads the content and generates questions ONLY from it</li>
                  <li>File content is NOT shown here - it goes directly to AI</li>
                </ul>
              </div>
            </div>

            {/* Question Type Section */}
            <div>
              <div className="grid grid-cols-12 gap-4 mb-3 text-xs font-medium text-gray-500">
                <div className="col-span-5">Question Type</div>
                <div className="col-span-3 text-center">No. of Questions</div>
                <div className="col-span-3 text-center">Marks</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-3">
                {formData.questionTypes.map((qt, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <select
                        value={qt.type}
                        onChange={(e) => updateQuestionType(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
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
                ))}
              </div>

              <button type="button" onClick={addQuestionType} className="mt-3 text-orange-500 text-sm hover:text-orange-600 font-medium">
                + Add Question Type
              </button>
            </div>

            <div className="text-right text-sm text-gray-600 pt-2 border-t border-gray-100">
              <div>Total Questions: <span className="font-bold text-gray-800">{totalQuestions}</span></div>
              <div>Total Marks: <span className="font-bold text-gray-800">{totalMarks}</span></div>
            </div>

            {/* Additional Information - Now clean, no file content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Instructions <span className="text-xs text-gray-400">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Add any specific instructions for the AI (e.g., Focus on chapters 1-5, include diagram questions, etc.)"
              />
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Sparkles size={10} className="text-orange-400" />
                These instructions will be combined with your uploaded file content
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                <span className="text-sm font-semibold text-orange-700">AI-Powered Generation</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                AI will read your uploaded file and generate questions based ONLY on that content.
              </p>
            </div>

            <div className="flex justify-between gap-4 pt-4">
              <Link href="/" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
                ← Previous
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-black rounded-lg text-sm font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Create & Generate Paper
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}