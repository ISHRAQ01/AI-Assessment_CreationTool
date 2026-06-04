import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Sparkles, Wrench, FileText, BarChart2, Brain, Mic, ImageIcon, ArrowRight } from 'lucide-react';

const TOOLS = [
  {
    icon: FileText,
    label: 'Question Paper Generator',
    description: 'Create customised question papers using AI from any topic or curriculum.',
    color: 'from-orange-400 to-red-500',
    badge: 'Popular',
  },
  {
    icon: BarChart2,
    label: 'Performance Analyser',
    description: 'Upload student scores and get instant insights, patterns, and suggestions.',
    color: 'from-blue-400 to-indigo-500',
    badge: 'New',
  },
  {
    icon: Brain,
    label: 'Lesson Planner',
    description: 'Generate detailed lesson plans aligned with your syllabus and learning outcomes.',
    color: 'from-purple-400 to-pink-500',
    badge: null,
  },
  {
    icon: Mic,
    label: 'Voice Notes Transcriber',
    description: 'Transcribe classroom audio or voice memos into structured notes automatically.',
    color: 'from-teal-400 to-emerald-500',
    badge: 'Beta',
  },
  {
    icon: ImageIcon,
    label: 'Diagram Explainer',
    description: 'Upload any diagram or chart and get a detailed, student-friendly explanation.',
    color: 'from-amber-400 to-yellow-500',
    badge: null,
  },
  {
    icon: Sparkles,
    label: 'Rubric Builder',
    description: 'Build grading rubrics in seconds using AI based on your assignment requirements.',
    color: 'from-rose-400 to-pink-500',
    badge: null,
  },
];

export default function ToolkitPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans">
      <Sidebar
        ctaLabel="AI Teacher's Toolkit"
        ctaGradient="linear-gradient(135deg, #FF6B35 0%, #E84646 100%)"
        ctaHref="/toolkit"
      />

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <TopBar backLabel="AI Teacher's Toolkit" />

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-300" />
            <h1 className="text-xl font-bold text-gray-900">AI Teacher's Toolkit</h1>
          </div>
          <p className="text-sm text-gray-400 mb-6 pl-5">
            Supercharge your teaching with AI-powered tools designed for educators.
          </p>

          {/* Featured banner */}
          <div
            className="rounded-2xl p-6 mb-8 flex items-center justify-between gap-6"
            style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
          >
            <div>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1">
                AI-Powered
              </p>
              <h2 className="text-lg font-bold text-white mb-1">
                Generate an assignment in 30 seconds
              </h2>
              <p className="text-sm text-gray-400">
                Describe the topic and let AI craft the perfect question paper.
              </p>
            </div>
            <a
              href="/create"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Try Now <ArrowRight size={14} />
            </a>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map(({ icon: Icon, label, description, color, badge }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  {badge && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg, #FF6B35, #E84646)' }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
                <div className="flex items-center text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Open Tool <ArrowRight size={12} className="ml-1" />
                </div>
              </div>
            ))}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}