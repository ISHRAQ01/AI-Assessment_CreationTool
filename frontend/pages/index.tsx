import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAssignmentStore } from '@/store/AssignmentStore';
import { useWebSocket } from '@/hooks/UseWebSocket';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import {
  Search, Filter, Grid3x3, FileText, Loader2, X, Calendar, Clock, Eye,
  CheckCircle, Zap, Activity,Plus,Sparkles
} from 'lucide-react';

// ── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: any = {
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      class: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      dot: 'bg-emerald-500'
    },
    generating: {
      icon: Loader2,
      label: 'Generating',
      class: 'bg-amber-50 text-amber-700 border border-amber-200',
      dot: 'bg-amber-500'
    },
    failed: {
      icon: CheckCircle,
      label: 'Failed',
      class: 'bg-rose-50 text-rose-700 border border-rose-200',
      dot: 'bg-rose-500'
    },
    draft: {
      icon: CheckCircle,
      label: 'Draft',
      class: 'bg-slate-50 text-slate-600 border border-slate-200',
      dot: 'bg-slate-400'
    },
  };
  const { icon: Icon, label, class: className, dot } = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
      {status === 'generating' && <Icon size={10} className="animate-spin ml-0.5" />}
    </span>
  );
}

// ── Assignment Card ───────────────────────────────────────────────
function AssignmentCard({ assignment, onDelete, viewMode }: any) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
        <div className="flex-1 min-w-0">
          <Link
            href={assignment.status === 'completed' ? `/assignment/${assignment._id}` : '#'}
            className={`font-semibold text-sm block truncate ${assignment.status === 'completed' ? 'text-gray-800 hover:text-orange-600' : 'text-gray-700'}`}
          >
            {assignment.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Created: {new Date(assignment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <StatusBadge status={assignment.status} />
          <div className="flex items-center gap-2">
            {assignment.status === 'completed' && (
              <Link
                href={`/assignment/${assignment._id}`}
                className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                title="View Generated Paper"
              >
                <Eye size={14} />
              </Link>
            )}
            <button
              onClick={() => onDelete(assignment._id)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:border-orange-200 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={assignment.status === 'completed' ? `/assignment/${assignment._id}` : '#'}
          className={`flex-1 text-sm font-semibold leading-snug ${
            assignment.status === 'completed'
              ? 'text-gray-800 hover:text-orange-600 group-hover:text-orange-600'
              : 'text-gray-600'
          } transition-colors line-clamp-2`}
        >
          {assignment.title}
        </Link>
        <button onClick={() => onDelete(assignment._id)} className="text-gray-400 hover:text-red-500 transition-colors">
          <span className="sr-only">Delete</span>
          ✕
        </button>
      </div>

      <div className="mb-3">
        <StatusBadge status={assignment.status} />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-50">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(assignment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="flex items-center gap-1 font-medium text-gray-600">
          <Clock size={12} />
          Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {assignment.status === 'completed' && (
        <div className="mt-3 pt-2 border-t border-gray-50">
          <Link
            href={`/assignment/${assignment._id}`}
            className="flex items-center justify-center gap-1 w-full py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors"
          >
            <Eye size={12} /> View Paper
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1.5">
          <path d="M12 4v16M8 8H4M20 8h-4" stroke="currentColor" strokeLinecap="round" />
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" />
        </svg>
      </div>d
      <h2 className="text-xl font-bold text-gray-800 mb-2">No assignments yet</h2>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Create your first assignment to start collecting and grading student submissions.
      </p>
      <Link
                href="/create"
                className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold"
                style={{ background: '#111', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
              >
                <Plus size={16} />
                Create Your First Assignment
              </Link>
    </div>
  );
}

// ── Main Dashboard Component ───────────────────────────────────────
export default function Dashboard() {
  const { assignments, setAssignments, updateAssignment, isLoading, setIsLoading } = useAssignmentStore();
  const { lastMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

  useEffect(() => { fetchAssignments(); }, []);

  useEffect(() => {
    if (lastMessage?.type === 'GENERATION_COMPLETED') {
      updateAssignment(lastMessage.assignmentId, {
        status: 'completed',
        generatedPaperId: lastMessage.questionPaperId
      });
    } else if (lastMessage?.type === 'GENERATION_FAILED') {
      updateAssignment(lastMessage.assignmentId, { status: 'failed' });
    }
  }, [lastMessage]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/assignments`);
      if (res.data.success) setAssignments(res.data.data);
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/assignments/${id}`);
      useAssignmentStore.getState().deleteAssignment(id);
    } catch (e) {
      console.error('Failed to delete assignment:', e);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === 'completed').length,
    generating: assignments.filter(a => a.status === 'generating').length,
    draft: assignments.filter(a => a.status === 'draft').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:ml-60 flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <TopBar backHref="/" backLabel="Home" />
  
  <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-8">
    {isLoading ? (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
          <Sparkles size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-400" />
        </div>
        <p className="text-gray-500 text-sm mt-4">Loading your assignments...</p>
      </div>
    ) : assignments.length === 0 ? (
      <EmptyState />
    ) : (
      <>
        {/* Title Section with Gradient */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              My Assignments
            </h1>
          </div>
          <p className="text-sm text-gray-500 pl-3">Manage and track all your AI-generated question papers</p>
        </div>

        {/* Stats Cards - Touch Friendly */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'from-blue-500 to-blue-600', icon: Activity, bg: 'bg-blue-50' },
            { label: 'Completed', value: stats.completed, color: 'from-emerald-500 to-teal-600', icon: CheckCircle, bg: 'bg-emerald-50' },
            { label: 'Generating', value: stats.generating, color: 'from-amber-500 to-orange-600', icon: Zap, bg: 'bg-amber-50' },
            { label: 'Draft', value: stats.draft, color: 'from-slate-500 to-slate-600', icon: FileText, bg: 'bg-slate-50' },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className={`${stat.bg} rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 active:scale-98`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                  <stat.icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter - Enhanced Touch Targets */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-[180px]">
            <Filter size={18} className="text-gray-400 flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all cursor-pointer"
            >
              <option value="all">📋 All Statuses</option>
              <option value="completed">✅ Completed</option>
              <option value="generating">⚡ Generating</option>
              <option value="draft">📝 Draft</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>
        </div>

        {/* View Toggle - Enhanced */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-md text-orange-500' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white shadow-md text-orange-500' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FileText size={16} />
            </button>
          </div>
        </div>

        {/* Assignments List - Enhanced Cards */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No assignments match your filters</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} 
              className="text-orange-500 text-sm mt-3 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((a: any) => (
              <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map((a: any) => (
              <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} viewMode={viewMode} />
            ))}
          </div>
        )}
      </>
    )}
  </main>
</div>
    </div>
  );
}