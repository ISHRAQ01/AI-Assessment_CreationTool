import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAssignmentStore } from '@/store/AssignmentStore';
import { useWebSocket } from '@/hooks/UseWebSocket';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import {
  Search, Filter, Grid3x3, FileText, Loader2, X, Calendar, Clock, Eye,
  CheckCircle, Zap, Activity
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
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">No assignments yet</h2>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Create your first assignment to start collecting and grading student submissions.
      </p>
      <Link
        href="/create"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm shadow-lg"
      >
        + Create Your First Assignment
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
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <TopBar backHref="/" backLabel="Home" />
        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
              <p className="text-gray-500 text-sm">Loading your assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Title & Stats */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">My Assignments</h1>
                <p className="text-sm text-gray-500">Manage and track all your AI-generated question papers</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total', value: stats.total, color: 'from-blue-500 to-blue-600', icon: Activity },
                  { label: 'Completed', value: stats.completed, color: 'from-emerald-500 to-teal-600', icon: CheckCircle },
                  { label: 'Generating', value: stats.generating, color: 'from-amber-500 to-orange-600', icon: Zap },
                  { label: 'Draft', value: stats.draft, color: 'from-slate-500 to-slate-600', icon: FileText },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 min-w-[180px]">
                  <Filter size={14} className="text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="generating">Generating</option>
                    <option value="draft">Draft</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-400'}`}
                  >
                    <Grid3x3 size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-400'}`}
                  >
                    <FileText size={14} />
                  </button>
                </div>
              </div>

              {/* Assignments List */}
              {filteredAssignments.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border">
                  <p className="text-gray-500">No assignments match your filters</p>
                  <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} className="text-orange-500 text-sm mt-2">
                    Clear filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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