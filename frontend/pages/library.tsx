import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Library, Search, Filter, Download, Eye, BookOpen, FileText, Clock } from 'lucide-react';

const MOCK_PAPERS = [
  { id: '1', title: 'Science – Class 8 Mid-Term', subject: 'Science', class: '8-A', date: '15-03-2025', marks: 50, questions: 25 },
  { id: '2', title: 'Mathematics – Class 9 Unit Test', subject: 'Mathematics', class: '9-B', date: '02-04-2025', marks: 30, questions: 15 },
  { id: '3', title: 'Physics – Class 10 Finals', subject: 'Physics', class: '10-C', date: '20-04-2025', marks: 70, questions: 35 },
  { id: '4', title: 'Biology – Class 7 Weekly Test', subject: 'Biology', class: '7-D', date: '28-04-2025', marks: 20, questions: 10 },
  { id: '5', title: 'Chemistry – Class 9 Revision', subject: 'Chemistry', class: '9-A', date: '05-05-2025', marks: 40, questions: 20 },
];

const SUBJECT_COLORS: Record<string, string> = {
  Science: 'bg-blue-50 text-blue-700',
  Mathematics: 'bg-emerald-50 text-emerald-700',
  Physics: 'bg-orange-50 text-orange-700',
  Biology: 'bg-purple-50 text-purple-700',
  Chemistry: 'bg-teal-50 text-teal-700',
};

export default function LibraryPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_PAPERS.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans">
      <Sidebar />

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <TopBar backLabel="My Library" />

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-300" />
            <h1 className="text-xl font-bold text-gray-900">My Library</h1>
          </div>
          <p className="text-sm text-gray-400 mb-6 pl-5">
            All your generated question papers, saved and ready to reuse.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {[
              { icon: FileText, label: 'Total Papers', value: MOCK_PAPERS.length, color: 'text-blue-600' },
              { icon: BookOpen, label: 'Subjects', value: 5, color: 'text-emerald-600' },
              { icon: Clock, label: 'This Month', value: 3, color: 'text-orange-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="relative flex-1 min-w-0 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search papers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Subject
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Marks / Qs
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((paper, i) => (
                  <tr
                    key={paper.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      i === filtered.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-900">{paper.title}</span>
                      <span className="block text-xs text-gray-400 mt-0.5">Class {paper.class}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          SUBJECT_COLORS[paper.subject] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {paper.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">{paper.date}</td>
                    <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">
                      {paper.marks} marks · {paper.questions} Qs
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Eye size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                      No papers found for "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}