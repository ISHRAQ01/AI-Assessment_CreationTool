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
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Answer Questions',
  'Fill in the Blanks',
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
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <div className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="sm:size-20" />
          </div>
          <span className="text-sm font-medium hidden sm:inline bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
            Assignment
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification Bell - Mobile Optimized */}
          <button className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors active:scale-95">
            <div className="relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-500">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            </div>
          </button>

          {/* Profile Section - Enhanced */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-full py-1 pl-1 pr-3 bg-gradient-to-r from-gray-50 to-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="relative">
              <img
                src="/avatar.png"
                alt="Profile"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-orange-300 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1 ring-white" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-gray-800 leading-tight">John Doe</span>
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400 hidden sm:block group-hover:text-gray-600 transition-colors"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* ========== SIDEBAR - Premium Mobile Design ========== */}
        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col justify-between lg:sticky lg:top-20 mb-6 lg:mb-0">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">

            {/* Logo Section - Enhanced */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                  <span className="text-black font-bold text-2xl">V</span>
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  VedaAI
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  AI Assessment Creator
                </p>
              </div>
            </div>

            {/* CTA Button - Premium */}
            <Link
              href="/create"
              className="group w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              <Plus size={16} className="text-orange-400 group-hover:rotate-90 transition-transform duration-300" />
              <span>Create Assignment</span>
              <Sparkles size={14} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            {/* Navigation - Enhanced */}
            <nav className="space-y-1 mt-6">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${item.active
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <item.icon
                    size={18}
                    className={`transition-all duration-200 ${item.active
                      ? 'text-orange-500'
                      : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.active && (
                    <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-red-500 rounded-full animate-pulse" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Settings & School Info - Premium */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 shadow-lg mt-4 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-3">
              <Settings size={14} />
              <span>Settings</span>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="relative">
                <img src="/avatar.png" alt="School" className="w-12 h-12 rounded-xl object-cover ring-2 ring-orange-100" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800 truncate">Delhi Public School</p>
                <p className="text-xs text-gray-500 truncate">Bokaro Steel City</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ========== MAIN FORM - Premium Mobile Design ========== */}
        <main className="flex-1 w-full">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Create Assignment
              </h1>
            </div>
            <p className="text-sm text-gray-500 pl-3">Set up a new assignment for your students</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 shadow-lg hover:shadow-xl transition-all duration-300 space-y-6">

            {/* Section Header */}
            <div className="pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Assignment Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">Basic information about your assignment</p>
            </div>

            {/* Title Input - Enhanced */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Assignment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all duration-200 text-gray-800 placeholder-gray-400"
                placeholder="e.g., Quiz on Electricity"
              />
            </div>

            {/* Subject & Class - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Science"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Class/Grade</label>
                <input
                  type="text"
                  placeholder="e.g. 8th"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all duration-200"
                />
              </div>
            </div>

            {/* Due Date & Time - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  <Calendar size={15} className="text-gray-400" />
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  <Clock size={15} className="text-gray-400" />
                  Time Allowed (minutes)
                </label>
                <input
                  type="number"
                  value={formData.timeAllowed}
                  onChange={(e) => setFormData({ ...formData, timeAllowed: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all duration-200"
                />
              </div>
            </div>

            {/* File Upload Area - Premium Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer ${dragActive
                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg scale-[1.01]'
                : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-orange-400 hover:shadow-md'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-100">
                <Upload size={28} className={`transition-colors ${dragActive ? 'text-orange-500' : 'text-gray-400'}`} />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">Choose a file or drag & drop it here</p>
              <p className="text-xs text-gray-400 mb-4">TXT or PDF files recommended</p>

              <input
                id="fileInput"
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-orange-300 transition-all duration-200 shadow-sm"
              >
                <File size={16} />
                Browse Files
              </button>

              {uploadedFile && (
                <div className="mt-5 flex items-center justify-between bg-white rounded-xl p-3 border-2 border-green-100 max-w-md mx-auto shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <File size={20} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-[250px]">{uploadedFile.name}</p>
                      <p className="text-xs text-green-600">
                        {fileContent && fileContent.length > 100
                          ? `✓ ${(fileContent.length / 1000).toFixed(1)}KB content extracted`
                          : `✓ File ready`}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="mt-5 text-xs text-blue-600 bg-blue-50/50 p-3 rounded-xl">
                <p className="font-semibold flex items-center gap-1">📌 How it works:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-left">
                  <li>Upload TXT or PDF file with your content</li>
                  <li>AI reads the content and generates questions ONLY from it</li>
                  <li>File content goes directly to AI</li>
                </ul>
              </div>
            </div>

            {/* Question Type Section */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={18} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-800">Configure Question Types</h2>
              </div>

              {/* Desktop Header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 mb-3 text-xs font-semibold text-gray-500 px-2">
                <div className="col-span-5">Question Type</div>
                <div className="col-span-3 text-center">No. of Questions</div>
                <div className="col-span-3 text-center">Marks per Question</div>
                <div className="col-span-1"></div>
              </div>

              {/* Mobile Header */}
              <div className="block sm:hidden mb-3 px-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Question Type</span>
                  <div className="flex gap-6">
                    <span className="text-xs font-semibold text-gray-500">Qty</span>
                    <span className="text-xs font-semibold text-gray-500">Marks</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {formData.questionTypes.map((qt, index) => (
                  <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center bg-gray-50/50 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none hover:bg-gray-50 transition-colors">
                    {/* Question Type Select */}
                    <div className="w-full sm:col-span-5">
                      <select
                        value={qt.type}
                        onChange={(e) => updateQuestionType(index, 'type', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                      >
                        {questionTypeOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Number of Questions Stepper */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:col-span-3">
                      <span className="text-xs text-gray-500 sm:hidden font-medium">Questions:</span>
                      <Stepper
                        value={qt.numberOfQuestions}
                        onChange={(v) => updateQuestionType(index, 'numberOfQuestions', v)}
                      />
                    </div>

                    {/* Marks Stepper */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:col-span-3">
                      <span className="text-xs text-gray-500 sm:hidden font-medium">Marks:</span>
                      <Stepper
                        value={qt.marksPerQuestion}
                        onChange={(v) => updateQuestionType(index, 'marksPerQuestion', v)}
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="flex justify-end w-full sm:w-auto sm:col-span-1">
                      {formData.questionTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionType(index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addQuestionType}
                className="mt-4 inline-flex items-center gap-2 text-orange-500 text-sm font-semibold hover:text-orange-600 transition-colors group"
              >
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Plus size={12} className="text-orange-500" />
                </div>
                Add Question Type
              </button>
            </div>

            {/* Totals Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Total Questions:</span>
                    <span className="text-xl font-bold text-gray-800">{totalQuestions}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Total Marks:</span>
                    <span className="text-xl font-bold text-gray-800">{totalMarks}</span>
                  </div>
                </div>
                {totalMarks > 0 && (
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">
                    ✓ Ready for AI generation
                  </div>
                )}
              </div>
            </div>

            {/* Additional Instructions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Instructions <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all duration-200"
                placeholder="Add any specific instructions for the AI (e.g., Focus on chapters 1-5, include diagram questions, etc.)"
              />
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Sparkles size={10} className="text-orange-400" />
                These instructions will be combined with your uploaded file content
              </p>
            </div>

            {/* AI Banner */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                  <Sparkles size={16} className="text-black" />
                </div>
                <span className="text-base font-bold text-orange-700">AI-Powered Generation</span>
              </div>
              <p className="text-sm text-orange-700/80 ml-10">
                AI will read your uploaded file and generate a complete question paper with sections, difficulty levels, and answer key.
                For MCQ questions, 4 options will be provided with correct answer indicated.
              </p>
            </div>

            {/* Action Buttons - Sticky on Mobile */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sticky bottom-4 sm:static bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl shadow-lg sm:shadow-none -mx-4 sm:mx-0 mt-4">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <ArrowLeft size={16} />
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-bold text-sm hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </main>
      </div>
    </div>
  );
}