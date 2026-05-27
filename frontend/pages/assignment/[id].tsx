import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { 
  ArrowLeft, Download, Printer, Share2, Copy, Check, 
  FileText, Clock, Calendar, BookOpen, Award, Sparkles,
  Loader2, Home, Users, Wrench, Library, Settings, ChevronDown
} from 'lucide-react';

interface Question {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

interface QuestionPaper {
  _id: string;
  subject: string;
  className: string;
  timeAllowed: number;
  maxMarks: number;
  sections: Section[];
  answerKey?: string;
}

interface Assignment {
  _id: string;
  title: string;
  status: string;
  generatedPaperId?: string;
}

export default function AssignmentOutput() {
  const router = useRouter();
  const { id } = router.query;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questionPaper, setQuestionPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    rollNumber: '',
    section: '',
  });
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchAssignment();
    }
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const assignmentId = Array.isArray(id) ? id[0] : id;
      const response = await axios.get(`/api/assignments/${assignmentId}`);
      if (response.data.success) {
        const assignmentData = response.data.data;
        setAssignment(assignmentData);
        
        if (assignmentData.generatedPaperId) {
          const paperId = typeof assignmentData.generatedPaperId === 'object' 
            ? assignmentData.generatedPaperId._id || assignmentData.generatedPaperId.toString()
            : assignmentData.generatedPaperId;
          await fetchQuestionPaper(paperId);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
      setLoading(false);
    }
  };

  const fetchQuestionPaper = async (paperId: string) => {
    try {
      const response = await axios.get(`/api/question-papers/${paperId}`);
      if (response.data.success) {
        const paper = response.data.data;
        if (paper.sections) {
          paper.sections = paper.sections.map((section: Section) => {
            const isMcqSection = section.title.toLowerCase().includes('multiple choice') ||
                                  (section.questions[0]?.text && /[A-D]\)/.test(section.questions[0].text));
            
            const processedQuestions = section.questions.map((question: Question) => {
              let text = question.text;
              
              if (isMcqSection) {
                const optionRegex = /([A-D])\)\s*([^\n]+)/g;
                const matches = [...text.matchAll(optionRegex)];
                
                if (matches.length >= 4) {
                  const options = matches.slice(0, 4).map(m => `${m[1]}) ${m[2].trim()}`);
                  const firstOptionIndex = text.search(/\n[A-D]\)/);
                  let questionText = firstOptionIndex !== -1 ? text.substring(0, firstOptionIndex).trim() : text;
                  questionText = questionText.replace(/^Question:\s*/i, '').replace(/\[Answer:\s*[A-D]\]/i, '').trim();
                  
                  return {
                    ...question,
                    text: questionText,
                    options: options,
                  };
                }
              }
              
              const cleanText = text.replace(/\[Answer:\s*[A-D]\]/i, '').trim();
              return { ...question, text: cleanText };
            });
            
            return { ...section, questions: processedQuestions };
          });
        }
        setQuestionPaper(paper);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch question paper:', error);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalTitle = document.title;
      document.title = `${assignment?.title || 'Question Paper'} - VedaAI`;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${assignment?.title || 'Question Paper'}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; }
                .school-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .paper-title { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; }
                .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .student-info { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .section { margin: 25px 0; }
                .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                .question { margin: 15px 0; padding: 10px; border: 1px solid #eee; border-radius: 5px; }
                .options { margin-left: 20px; margin-top: 8px; }
                .option { margin: 3px 0; }
                .difficulty { font-size: 12px; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-left: 10px; }
                .easy { background: #d1fae5; color: #065f46; }
                .moderate { background: #fef3c7; color: #92400e; }
                .challenging { background: #fee2e2; color: #991b1b; }
                .marks { float: right; font-weight: bold; }
                .answer-key { margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px; }
                hr { margin: 20px 0; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      document.title = originalTitle;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  const handleDownloadAnswerKey = () => {
    if (!questionPaper?.answerKey) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Answer Key - ${assignment?.title || 'Assignment'}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 40px; line-height: 1.6; }
              h1 { text-align: center; color: #333; }
              .section { margin: 20px 0; }
              .section-title { font-size: 18px; font-weight: bold; background: #f0f0f0; padding: 10px; }
              .answer { margin: 5px 0; }
              hr { margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>Answer Key</h1>
            <p><strong>Assignment:</strong> ${assignment?.title}</p>
            <p><strong>Subject:</strong> ${questionPaper?.subject}</p>
            <p><strong>Class:</strong> ${questionPaper?.className}</p>
            <hr/>
            <pre style="font-family: 'Courier New', monospace; font-size: 14px;">${questionPaper.answerKey}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your question paper...</p>
        </div>
      </div>
    );
  }

  if (!assignment || assignment.status !== 'completed' || !questionPaper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Assignment Still Generating</h2>
            <p className="text-yellow-700">
              Your question paper is being generated by AI. This may take a few seconds.
              <br />
              <span className="text-sm">Status: {assignment?.status || 'Processing'}</span>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Question Paper Container */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* School Header */}
          <div className="border-b border-gray-200 p-8 text-center bg-gradient-to-r from-orange-50 to-amber-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Delhi Public School, Sector-4, Bokaro</h1>
            <div className="mt-6 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="text-left">
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-semibold text-gray-800">{questionPaper.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-semibold text-gray-800">{questionPaper.className}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">Time Allowed</p>
                <p className="font-semibold text-gray-800">{questionPaper.timeAllowed} minutes</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Maximum Marks</p>
                <p className="font-semibold text-gray-800">{questionPaper.maxMarks}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border-b border-yellow-100 p-4">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
              All questions are compulsory unless stated otherwise.
            </p>
          </div>

          {/* Student Info Section */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                <input
                  type="text"
                  value={studentInfo.rollNumber}
                  onChange={(e) => setStudentInfo({ ...studentInfo, rollNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Enter roll number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                <input
                  type="text"
                  value={studentInfo.section}
                  onChange={(e) => setStudentInfo({ ...studentInfo, section: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Enter section"
                />
              </div>
            </div>
          </div>

          {/* Questions Sections */}
          <div className="p-8">
            {questionPaper.sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6 italic">{section.instruction}</p>
                
                <div className="space-y-4">
                  {section.questions.map((question, qIdx) => (
                    <div key={qIdx} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="font-semibold text-gray-900 text-lg">
                              {qIdx + 1}.
                            </span>
                            <span className="text-gray-800">{question.text}</span>
                          </div>
                          
                          {question.options && question.options.length > 0 && (
                            <div className="ml-6 mt-3 space-y-1.5">
                              {question.options.map((option, optIdx) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                let optionText = option;
                                if (optionText.match(/^[A-D]\)\s*/)) {
                                  optionText = optionText.replace(/^[A-D]\)\s*/, '');
                                }
                                return (
                                  <div key={optIdx} className="text-sm text-gray-700">
                                    <span className="font-medium text-gray-500 mr-2">{letter}.</span>
                                    <span>{optionText}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                            {question.marks} marks
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* End of Paper */}
          <div className="border-t border-gray-200 p-6 text-center text-gray-400 text-sm">
            <p>*** End of Question Paper ***</p>
          </div>
        </div>

        {/* Answer Key Section - Section-wise with Download */}
        {questionPaper.answerKey && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between hover:from-gray-700 hover:to-gray-800 transition"
            >
              <div className="flex items-center gap-2">
                <Award size={20} className="text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Answer Key (Teacher Only)</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadAnswerKey(); }}
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition"
                >
                  <Download size={14} />
                  Download PDF
                </button>
                <ChevronDown size={20} className={`text-white transition-transform ${showAnswerKey ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {showAnswerKey && (
              <div className="p-6 bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                  {questionPaper.answerKey}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {/* Footer Note */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Generated by VedaAI - AI-Powered Assessment Platform</p>
          <p className="mt-1">Answer key available for teachers - click to reveal</p>
        </div>
      </div>
    </div>
  );
}