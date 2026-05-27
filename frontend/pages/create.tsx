import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Trash2, Calendar, Clock, FileText, 
  BookOpen, Sparkles, CheckCircle, AlertCircle, Loader2,
  HelpCircle, ChevronRight, Zap, Layers, Target, Upload, X, File,
  Home, Users, Wrench, Library, Settings
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
  'Numerical Problems'
];

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
    timeAllowed:'',
    questionTypes: [] as QuestionType[],
    additionalInstructions: '',
  });

  // Reset to default question types when component mounts (new assignment)
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      questionTypes: [
        
      ]
    }));
  }, []); 

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

  const handleFileRead = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      
      // Extract title from filename (remove extension)
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const extractedTitle = fileName.charAt(0).toUpperCase() + fileName.slice(1);
      
      // Try to extract subject from content
      let extractedSubject = formData.subject;
      const subjectKeywords = ['Math', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
      for (const keyword of subjectKeywords) {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          extractedSubject = keyword;
          break;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        title: prev.title || extractedTitle,
        subject: extractedSubject,
        additionalInstructions: prev.additionalInstructions + (prev.additionalInstructions ? '\n\n' : '') + `File uploaded: ${file.name}\n${content.substring(0, 500)}...`
      }));
    };
    reader.readAsText(file);
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
    
    // Prepare additional instructions with file content if uploaded
    let finalInstructions = formData.additionalInstructions;
    if (fileContent) {
      finalInstructions = `${formData.additionalInstructions}\n\n--- Content from uploaded file ---\n${fileContent}`;
    }
    
    // Add MCQ instruction to ensure proper format
    const mcqTypes = formData.questionTypes.filter(qt => qt.type === 'Multiple Choice Questions');
    if (mcqTypes.length > 0) {
      finalInstructions += `\n\nIMPORTANT: For Multiple Choice Questions, please provide 4 options (A, B, C, D) with the correct answer marked. Format: "Question text? A) Option1 B) Option2 C) Option3 D) Option4 [Answer: A]"`;
    }
    
    try {
      const response = await axios.post('/api/assignments', {
        title: formData.title,
        description: `${formData.subject} - ${formData.className}`,
        dueDate: formData.dueDate,
        questionTypes: formData.questionTypes,
        additionalInstructions: finalInstructions,
      });
      
      if (response.data.success) {
        const assignmentId = response.data.data._id;
        
        await axios.post('/api/generate', {
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
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-900">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Assignment</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <button className="relative p-1 text-gray-500 hover:text-gray-800">
            <img 
              src="/icon.png" 
              alt="Logo" 
              className="w-8 h-8 rounded-full object-cover"
            />
          </button>
          
          <div className="flex items-center gap-2 border border-gray-200 rounded-full py-1 px-3 bg-gray-50">
            <img 
              src="/avataat.png" 
              alt="Profile" 
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="text-sm font-semibold text-gray-700">John Doe</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-8 flex gap-8">
        
        {/* Left Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col justify-between h-[calc(100vh-120px)] sticky top-20">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-6">
            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white text-base">
                V
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">VedaAI</span>
            </div>

            <Link href="/create" className="w-full bg-[#2D2E32] text-white rounded-full py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-sm">
              <Plus size={16} className="text-orange-400" />
              <span>Create Assignment</span>
            </Link>

            <nav className="space-y-1">
              {[
                { name: 'Home', icon: Home, active: false, href: '/' },
                { name: 'My Groups', icon: Users, active: false, href: '#' },
                { name: 'Assignments', icon: FileText, active: true, href: '/dashboard' },
                { name: "AI Teacher's Toolkit", icon: Wrench, active: false, href: '#' },
                { name: 'My Library', icon: Library, active: false, href: '#' },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
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
              <img 
                src="/avataat.png" 
                alt="School" 
                className="w-10 h-10 rounded-lg object-cover"
              />
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

            {/* Title Input */}
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

            {/* Subject and Class */}
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

            {/* Due Date and Time Allowed */}
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

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">Choose a file or drag & drop it here</p>
              <p className="text-xs text-gray-400 mt-1">TXT, PDF, DOC, up to 10MB</p>
              
              <input
                id="fileInput"
                type="file"
                accept=".txt,.pdf,.doc,.docx"
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
                      <p className="text-xs text-green-600">✓ Title & subject extracted</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-200">
                Upload document to automatically extract title and subject
              </p>
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
                      <input
                        type="number"
                        min="1"
                        value={qt.numberOfQuestions}
                        onChange={(e) => updateQuestionType(index, 'numberOfQuestions', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        value={qt.marksPerQuestion}
                        onChange={(e) => updateQuestionType(index, 'marksPerQuestion', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div className="col-span-1 text-center">
                      {formData.questionTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionType(index)}
                          className="text-gray-400 hover:text-red-500"
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
                className="mt-3 text-orange-500 text-sm hover:text-orange-600 font-medium"
              >
                + Add Question Type
              </button>
            </div>

            {/* Totals */}
            <div className="text-right text-sm text-gray-600 pt-2 border-t border-gray-100">
              <div>Total Questions: <span className="font-bold text-gray-800">{totalQuestions}</span></div>
              <div>Total Marks: <span className="font-bold text-gray-800">{totalMarks}</span></div>
            </div>

            {/* Additional Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Information <span className="text-xs text-gray-400">(For better output)</span>
              </label>
              <textarea
                rows={3}
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="e.g., Generate a question paper for 3 hour exam duration..."
              />
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Sparkles size={10} className="text-orange-400" />
                AI will use this context to generate better questions
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
            <div className="flex justify-between gap-4 pt-4">
              <Link
                href="/"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
              >
                ← Previous
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Assignment...
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