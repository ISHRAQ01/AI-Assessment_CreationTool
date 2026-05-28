import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Users, Plus, Search, MoreVertical } from 'lucide-react';

const MOCK_GROUPS = [
  { id: '1', name: 'Class 8-A', subject: 'Science', students: 34, color: 'from-blue-400 to-indigo-500' },
  { id: '2', name: 'Class 9-B', subject: 'Mathematics', students: 29, color: 'from-emerald-400 to-teal-500' },
  { id: '3', name: 'Class 10-C', subject: 'Physics', students: 31, color: 'from-orange-400 to-red-500' },
  { id: '4', name: 'Class 7-D', subject: 'Biology', students: 36, color: 'from-purple-400 to-pink-500' },
];

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans">
      <Sidebar />

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <TopBar backLabel="My Groups" />

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-300" />
            <h1 className="text-xl font-bold text-gray-900">My Groups</h1>
          </div>
          <p className="text-sm text-gray-400 mb-6 pl-5">Manage your class groups and student lists.</p>

          {/* Search + Create row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 min-w-0 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ background: '#111', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
            >
              <Plus size={15} />
              New Group
            </button>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_GROUPS.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center`}
                  >
                    <Users size={22} className="text-white" />
                  </div>
                  <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">{group.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{group.subject}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                  <span>
                    <span className="font-semibold text-gray-600">{group.students}</span> students
                  </span>
                  <button className="text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    View →
                  </button>
                </div>
              </div>
            ))}

            {/* Add group card */}
            <button className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 hover:border-gray-300 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-3 min-h-[160px] cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Plus size={22} className="text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-500">Add New Group</span>
            </button>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}