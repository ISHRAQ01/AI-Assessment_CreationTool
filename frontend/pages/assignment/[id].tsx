import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import {
  ArrowLeft, Download, Printer, Share2, Copy, Check,
  FileText, Clock, Calendar, BookOpen, Award, Sparkles,
  Loader2, Home, Users, Wrench, Library, Settings, ChevronDown,
  ChevronLeft, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

// Difficulty Badge Component
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    Easy: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    Moderate: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500'  },
    Challenging: {bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  };
  const style = map[difficulty] || map.Easy;
  return (
    <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${style.bg} ${style.text}`}>
      <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${style.dot}`} />
      {difficulty}
    </span>
  );
}

// Print utility
function printPaper(el?: HTMLElement | null) {
  if (!el) return window.print();
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return window.print();
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('input, textarea').forEach((node) => {
    const n = node as HTMLInputElement | HTMLTextAreaElement;
    const span = document.createElement('span');
    span.textContent = n.value || n.placeholder || '';
    node.parentNode?.replaceChild(span, node);
  });
  const headHtml = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join('\n');
  const overrideStyles = `<style>
    @media print {
      body * { visibility: visible !important; }
      aside, header, button, a { display: none !important; }
    }
    body { background: #fff; color: #000; }
  </style>`;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8">${headHtml}\n${overrideStyles}
    <style>@page{size:auto;margin:20mm} body{background:#fff}</style></head><body>
    ${clone.outerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); win.close(); } catch (e) { console.error('Print failed', e); } }, 700);
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
    if (id) fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const assignmentId = Array.isArray(id) ? id[0] : id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignmentId}`);
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/question-papers/${paperId}`);
      if (response.data.success) {
        const paper = response.data.data;
        if (paper.sections) {
          paper.sections = paper.sections.map((section: Section) => {
            const isMcqSection = section.title.toLowerCase().includes('multiple choice');

            const processedQuestions = section.questions.map((question: Question) => {
              let text = question.text;

              text = text.replace(/\\n/g, '\n');
              text = text.replace(/^Short question:\s*/i, '');
              text = text.replace(/^Short question\s*/i, '');
              text = text.replace(/^Numerical problem:\s*/i, '');
              text = text.replace(/^Diagram question:\s*/i, '');
              text = text.replace(/^Question:\s*/i, '');

              if (isMcqSection) {
                // IMPROVED: Try multiple option regex patterns
                let options: string[] = [];
                let questionText = text;

                // Pattern 1: A) Option  B) Option  C) Option  D) Option
                const pattern1 = /([A-D]\))\s*([^\n]+)/g;
                const matches1 = [...text.matchAll(pattern1)];
                
                // Pattern 2: A. Option  B. Option  C. Option  D. Option
                const pattern2 = /([A-D]\.)\s*([^\n]+)/g;
                const matches2 = [...text.matchAll(pattern2)];
                
                // Pattern 3: (A) Option  (B) Option  (C) Option  (D) Option
                const pattern3 = /\(([A-D])\)\s*([^\n]+)/g;
                const matches3 = [...text.matchAll(pattern3)];

                if (matches1.length >= 4) {
                  options = matches1.slice(0, 4).map(m => `${m[1]} ${m[2].trim()}`);
                  const firstOptionIndex = text.search(/\n[A-D]\)/);
                  questionText = firstOptionIndex !== -1 ? text.substring(0, firstOptionIndex).trim() : text;
                } else if (matches2.length >= 4) {
                  options = matches2.slice(0, 4).map(m => `${m[1]} ${m[2].trim()}`);
                  const firstOptionIndex = text.search(/\n[A-D]\./);
                  questionText = firstOptionIndex !== -1 ? text.substring(0, firstOptionIndex).trim() : text;
                } else if (matches3.length >= 4) {
                  options = matches3.slice(0, 4).map(m => `(${m[1]}) ${m[2].trim()}`);
                  const firstOptionIndex = text.search(/\n\([A-D]\)/);
                  questionText = firstOptionIndex !== -1 ? text.substring(0, firstOptionIndex).trim() : text;
                }

                // Clean question text
                questionText = questionText.replace(/\[Answer:\s*[A-D]\]/i, '').trim();

                if (options.length >= 4) {
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

  const downloadAsPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 280;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 280;
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    const clone = printRef.current.cloneNode(true) as HTMLElement;
    const answerKeyDiv = clone.querySelector('.answer-key-section');
    if (answerKeyDiv) {
      answerKeyDiv.remove();
    }

    const tempId = 'temp-pdf-content';
    clone.id = tempId;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    document.body.appendChild(clone);

    await downloadAsPDF(tempId, assignment?.title || 'Question_Paper');
    document.body.removeChild(clone);
  };

  const handleDownloadAnswerKey = async () => {
    if (!questionPaper?.answerKey) return;

    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-answerkey';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #ddd; padding-bottom: 20px;">
          <h1 style="font-size: 24px; margin-bottom: 10px;">Delhi Public School, Sector-4, Bokaro</h1>
          <p style="font-size: 14px; color: #666;">Bokaro Steel City</p>
          <h2 style="font-size: 18px; margin: 20px 0 10px;">ANSWER KEY</h2>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span><strong>Assignment:</strong> ${assignment?.title}</span>
            <span><strong>Subject:</strong> ${questionPaper?.subject}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span><strong>Class:</strong> ${questionPaper?.className}</span>
            <span><strong>Maximum Marks:</strong> ${questionPaper?.maxMarks}</span>
          </div>
        </div>
        <div style="margin: 20px 0;">
          <pre style="font-family: 'Courier New', monospace; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${questionPaper.answerKey.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
          Generated by AITeacher - AI-Powered Assessment Platform
        </div>
      </div>
    `;
    document.body.appendChild(tempDiv);

    await downloadAsPDF('temp-answerkey', `Answer_Key_${assignment?.title || 'Assignment'}`);
    document.body.removeChild(tempDiv);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading question paper…</p>
        </div>
      </div>
    );
  }

  if (!assignment || assignment.status !== 'completed' || !questionPaper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8 transition">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={24} className="text-amber-500 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Generating your paper…</h2>
            <p className="text-sm text-gray-500 mb-1">AI is crafting your question paper.</p>
            <p className="text-xs text-gray-400 mb-6">
              Status: <span className="font-medium text-amber-600">{assignment?.status || 'Processing'}</span>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition"
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
        <div className="px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              {copied ? <Check size={14} className="sm:w-4 sm:h-4 text-green-500" /> : <Copy size={14} className="sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">

        {/* AI Banner */}
        <div
          className="rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
        >
          <p className="text-white text-xs sm:text-sm leading-relaxed font-medium flex-1">
            Certainly, {studentInfo.name || 'Teacher'}! Here are customized Question Papers for your{' '}
            {questionPaper.subject} – Class {questionPaper.className} students.
          </p>
        </div>

        {/* Question Paper Container */}
        <div ref={printRef} className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">

          {/* School Header */}
          <div className="px-4 sm:px-6 md:px-10 pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 text-center border-b border-gray-100">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Delhi Public School, Sector-4, Bokaro</h1>
            <p className="mt-1 sm:mt-1.5 text-sm sm:text-base font-semibold text-gray-700">Subject: {questionPaper.subject}</p>
            <p className="text-sm sm:text-base font-semibold text-gray-700">Class: {questionPaper.className}</p>
          </div>

          {/* Meta Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50 gap-2 sm:gap-0">
            <span className="text-xs sm:text-sm font-semibold text-gray-800">Time Allowed: {questionPaper.timeAllowed} minutes</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-800">Maximum Marks: {questionPaper.maxMarks}</span>
          </div>

          {/* Instructions */}
          <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 border-b border-gray-100">
            <p className="text-xs sm:text-sm font-semibold text-gray-800">All questions are compulsory unless stated otherwise.</p>
          </div>

          {/* Student Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">Name:</span>
              <input
                type="text"
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                placeholder=""
                className="border-b border-gray-400 text-xs sm:text-sm text-gray-800 bg-transparent focus:outline-none focus:border-gray-800 w-full pb-0.5 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">Roll Number:</span>
              <input
                type="text"
                value={studentInfo.rollNumber}
                onChange={(e) => setStudentInfo({ ...studentInfo, rollNumber: e.target.value })}
                placeholder=""
                className="border-b border-gray-400 text-xs sm:text-sm text-gray-800 bg-transparent focus:outline-none focus:border-gray-800 w-full pb-0.5 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">Section:</span>
              <input
                type="text"
                value={studentInfo.section}
                onChange={(e) => setStudentInfo({ ...studentInfo, section: e.target.value })}
                placeholder=""
                className="border-b border-gray-400 text-xs sm:text-sm text-gray-800 bg-transparent focus:outline-none focus:border-gray-800 w-full pb-0.5 transition-colors"
              />
            </div>
          </div>

          {/* Questions Sections */}
          <div className="px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-8 sm:space-y-10">
            {questionPaper.sections.map((section, sectionIdx) => {
              let qCounter = 0;
              for (let i = 0; i < sectionIdx; i++) qCounter += questionPaper.sections[i].questions.length;
              return (
                <div key={sectionIdx}>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 text-center mb-1">{section.title}</h2>
                  <div className="mb-1">
                    <p className="text-xs sm:text-sm font-bold text-gray-800">
                      {section.questions[0] ? (section.instruction?.split('.')[0] || 'Questions') : ''}
                    </p>
                    {section.instruction && (
                      <p className="text-xs text-gray-500 italic">{section.instruction}</p>
                    )}
                  </div>
                  <ol className="mt-4 space-y-3 sm:space-y-4 list-none">
                    {section.questions.map((question, qIdx) => {
                      const num = qCounter + qIdx + 1;
                      return (
                        <li key={qIdx} className="flex items-start gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700 w-5 sm:w-7 flex-shrink-0 mt-0.5">{num}.</span>
                          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-4">
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{question.text}</p>
                              {question.options && question.options.length > 0 && (
                                <div className="mt-2 ml-2 sm:ml-4 space-y-1">
                                  {question.options.map((option, optIdx) => {
                                    const letter = String.fromCharCode(65 + optIdx);
                                    let optionText = option;
                                    if (optionText.match(/^[A-D]\)\s*/)) {
                                      optionText = optionText.replace(/^[A-D]\)\s*/, '');
                                    } else if (optionText.match(/^[A-D]\.\s*/)) {
                                      optionText = optionText.replace(/^[A-D]\.\s*/, '');
                                    } else if (optionText.match(/^\([A-D]\)\s*/)) {
                                      optionText = optionText.replace(/^\([A-D]\)\s*/, '');
                                    }
                                    return (
                                      <div key={optIdx} className="text-xs sm:text-sm text-gray-600">
                                        {letter}. {optionText}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 mt-1 sm:mt-0">
                              <DifficultyBadge difficulty={question.difficulty} />
                              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                                [{question.marks} Marks]
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>

          {/* End of Paper */}
          <div className="px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 text-center">
            <p className="text-xs sm:text-sm font-bold text-gray-800">End of Question Paper</p>
          </div>
        </div>

        {/* Answer Key Section */}
        {questionPaper.answerKey && (
          <div className="answer-key-section mt-4 sm:mt-6 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="w-full px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex items-center justify-between text-xs sm:text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <span>Answer Key:</span>
              <ChevronDown size={14} className={`sm:w-4 sm:h-4 text-gray-400 transition-transform ${showAnswerKey ? 'rotate-180' : ''}`} />
            </button>
            {showAnswerKey && (
              <div className="px-4 sm:px-6 md:px-10 pb-6 sm:pb-8">
                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{questionPaper.answerKey}</div>
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-4 sm:mt-6 text-center text-xs text-gray-400">
          <p>Generated by AITeacher - AI-Powered Assessment Platform</p>
          <p className="mt-1">Answer key available for teachers - click to reveal</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6">
          <Link href="/" className="text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 order-2 sm:order-1">
            <ChevronLeft size={14} />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={() => router.push('/create')}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-200 rounded-full text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white transition-all hover:opacity-90 w-full sm:w-auto"
              style={{ background: '#111' }}
            >
              <Download size={14} />
              Download Paper
            </button>
            <button
              onClick={handleDownloadAnswerKey}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white transition-all hover:opacity-90 w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)' }}
            >
              <Award size={14} />
              Download Answer Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
