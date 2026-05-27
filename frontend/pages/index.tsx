import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAssignmentStore } from '@/store/AssignmentStore';
import { useWebSocket } from '@/hooks/UseWebSocket';
import {
  Home, Users, BookOpen, Wrench, Library,
  Settings, Bell, ChevronDown, Search,
  MoreVertical, Eye, Trash2, Plus, Sparkles, X, CheckCircle,
  Clock, AlertCircle, Filter, Calendar, Loader2, Menu,
  Zap, Activity, Grid3x3, FileText, Brain, User, LayoutDashboard,
  GraduationCap, School, MapPin, UserCircle2, ArrowRight, LogOut, 
  Copy, Share2, Star, TrendingUp, Target
} from 'lucide-react';

// ── VedaAI Logo ───────────────────────────────────────────────────
function VedaLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: 'linear-gradient(135deg, #FF6B35 0%, #E84646 100%)',
        flexShrink: 0,
      }}
    >
      <span style={{ color: '#fff', fontWeight: 900, fontSize: size * 0.5 }}>V</span>
    </div>
  );
}

// ── Enhanced Profile Modal ─────────────────────────────────────────
function ProfileModal({ isOpen, onClose, profiles, currentProfile, onSelectProfile, onCreateProfile }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [newCity, setNewCity] = useState('');
  const [activeTab, setActiveTab] = useState('select');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (newName && newSchool) {
      onCreateProfile({ 
        name: newName, 
        school: newSchool, 
        city: newCity || 'School',
        avatar: '/avataat.png',
        role: 'Teacher'
      });
      setShowCreate(false);
      setNewName('');
      setNewSchool('');
      setNewCity('');
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 transition-all" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl w-[28rem] max-w-[95vw] z-50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-black">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Profile Manager</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-white/20 rounded-xl p-1">
            <button
              onClick={() => { setActiveTab('select'); setShowCreate(false); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'select' ? 'bg-white text-orange-600' : 'text-white/90'
              }`}
            >
              Select Profile
            </button>
            <button
              onClick={() => { setActiveTab('create'); setShowCreate(true); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'create' ? 'bg-white text-orange-600' : 'text-white/90'
              }`}
            >
              Create New
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {!showCreate ? (
            <div className="space-y-3">
              {profiles.map((p: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => { onSelectProfile(p); onClose(); }}
                  className={`w-full text-left p-4 rounded-2xl transition-all group hover:shadow-md ${
                    currentProfile?.name === p.name 
                      ? 'bg-orange-50 border-2 border-orange-200 shadow-sm' 
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={p.avatar || "/avataat.png"} 
                      alt={p.name} 
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-offset-2 ring-gray-100"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        {p.name}
                        {currentProfile?.name === p.name && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <School size={12} /> {p.school}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {p.city}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                    <UserCircle2 size={32} className="text-black" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">New Profile</p>
                    <p className="text-xs text-gray-500">Add your teaching profile</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">School/Institution</label>
                    <input
                      type="text"
                      placeholder="e.g., Delhi Public School"
                      value={newSchool}
                      onChange={(e) => setNewSchool(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">City</label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCreate}
                disabled={!newName || !newSchool}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={16} /> Create Profile
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Enhanced Status Badge ──────────────────────────────────────────
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
      icon: AlertCircle, 
      label: 'Failed', 
      class: 'bg-rose-50 text-rose-700 border border-rose-200',
      dot: 'bg-rose-500'
    },
    draft: { 
      icon: Clock, 
      label: 'Draft', 
      class: 'bg-slate-50 text-slate-600 border border-slate-200',
      dot: 'bg-slate-400'
    },
  };
  const { icon: Icon, label, class: className, dot } = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {label}
      {status === 'generating' && <Icon size={10} className="animate-spin ml-0.5" />}
    </span>
  );
}

// ── Enhanced Empty State ───────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
  <div className="relative mb-8">
    <div className="w-28 h-28 bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform shadow-lg">
      <GraduationCap size={48} className="text-orange-500" />
    </div>
    <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
      <Sparkles size={16} className="text-white" />
    </div>
  </div>
  
  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
    Welcome to VedaAI
  </h2>
  
  <p className="text-gray-600 text-sm max-w-xs mb-8 leading-relaxed">
    Your AI-powered teaching assistant. Create your first assignment and experience the magic of automated question paper generation.
  </p>
  
  <Link 
    href="/create" 
    className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300"
    style={{ 
      background: 'linear-gradient(135deg, #FF6B35 0%, #E84646 100%)',
      boxShadow: '0 10px 25px -5px rgba(255, 107, 53, 0.4)',
      color: '#FFFFFF'
    }}
  >
    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
    <span className="relative z-10">Create Your First Assignment</span>
    <ArrowRight 
      size={18} 
      className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300" 
    />
    
    {/* Hover overlay that maintains visibility */}
    <div 
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ 
        background: 'linear-gradient(135deg, #E84646 0%, #FF6B35 100%)',
      }}
    ></div>
  </Link>
</div>
  );
}

// ── Enhanced Assignment Card ───────────────────────────────────────
function AssignmentCard({ assignment, onDelete }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-orange-200 transition-all group cursor-pointer">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link 
          href={assignment.status === 'completed' ? `/assignment/${assignment._id}` : '#'} 
          className={`flex-1 text-sm font-semibold leading-snug ${
            assignment.status === 'completed' 
              ? 'text-gray-800 hover:text-orange-600 group-hover:text-orange-600' 
              : 'text-gray-700'
          } transition-colors`}
        >
          {assignment.title}
        </Link>
        <AssignmentCardMenu 
          assignmentId={assignment._id} 
          isCompleted={assignment.status === 'completed'} 
          generatedPaperId={assignment.generatedPaperId} 
          onDelete={onDelete} 
        />
      </div>
      
      <div className="mb-3">
        <StatusBadge status={assignment.status} />
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(assignment.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
        <span className="flex items-center gap-1 font-medium text-gray-600">
          <Clock size={12} />
          Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>
      
      {assignment.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link 
            href={`/assignment/${assignment._id}`}
            className="flex items-center justify-center gap-2 w-full py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-semibold hover:bg-orange-100 transition-colors"
          >
            <Eye size={12} /> View Generated Paper
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Enhanced Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const { assignments, setAssignments, updateAssignment, isLoading, setIsLoading } = useAssignmentStore();
  const { lastMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Profile state
  const [profiles, setProfiles] = useState([
    { name: 'John Doe', school: 'Delhi Public School', city: 'Bokaro Steel City', avatar: '/avataat.png' },
    { name: 'ISHRAQ', school: 'CSHP', city: 'GHAZIABAD', avatar: '/avataat.png' }
  ]);
  const [currentProfile, setCurrentProfile] = useState(profiles[0]);

  useEffect(() => {
    const saved = localStorage.getItem('vedaai_profiles');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfiles(parsed);
      const last = localStorage.getItem('vedaai_current_profile');
      if (last) setCurrentProfile(JSON.parse(last));
    }
  }, []);

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
      const res = await axios.get('/api/assignments');
      if (res.data.success) setAssignments(res.data.data);
    } catch (e) { 
      console.error('Failed to fetch assignments:', e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/assignments/${id}`);
      useAssignmentStore.getState().deleteAssignment(id);
    } catch (e) { 
      console.error('Failed to delete assignment:', e); 
    }
  };

  const handleCreateProfile = (profile: any) => {
    const newProfiles = [...profiles, profile];
    setProfiles(newProfiles);
    setCurrentProfile(profile);
    localStorage.setItem('vedaai_profiles', JSON.stringify(newProfiles));
    localStorage.setItem('vedaai_current_profile', JSON.stringify(profile));
  };

  const handleSelectProfile = (profile: any) => {
    setCurrentProfile(profile);
    localStorage.setItem('vedaai_current_profile', JSON.stringify(profile));
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

  const navItems = [
    { icon: Home, label: 'Home', active: true, href: '/' },
    { icon: Users, label: 'My Groups', active: false, href: '/groups' },
    { icon: BookOpen, label: 'Assignments', active: false, href: '/dashboard' },
    { icon: Brain, label: 'AI Toolkit', active: false, href: '/toolkit' },
    { icon: Library, label: 'My Library', active: false, href: '/library' },
  ];

  const statCards = [
    { label: 'Total', value: stats.total, icon: FileText, color: 'from-blue-500 to-blue-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Generating', value: stats.generating, icon: Zap, color: 'from-amber-500 to-amber-600' },
    { label: 'Draft', value: stats.draft, icon: Clock, color: 'from-slate-500 to-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profiles={profiles} 
        currentProfile={currentProfile} 
        onSelectProfile={handleSelectProfile} 
        onCreateProfile={handleCreateProfile} 
      />

      {/* Enhanced Mobile Sidebar */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transition-transform duration-300 ease-out shadow-2xl lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <VedaLogo size={44} />
              <div>
                <span className="text-xl font-bold text-gray-800">VedaAI</span>
                <p className="text-xs text-gray-500">AI Teacher Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <Link 
            href="/create" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            <Sparkles size={16} /> Create New Assignment
          </Link>
        </div>
        
        <nav className="px-4 space-y-1">
          {navItems.map(({ icon: Icon, label, active, href }) => (
            <Link 
              key={label} 
              href={href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                active 
                  ? 'bg-orange-50 text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon size={20} /> {label}
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <button 
            onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }} 
            className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-2xl transition-colors"
          >
            <img 
              src="/avataat.png" 
              alt="Profile" 
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-100" 
            />
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-gray-800">{currentProfile.name}</p>
              <p className="text-xs text-gray-500">{currentProfile.school}</p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Enhanced Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-100 flex-col z-30 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
             <img 
    src="/icon.png" 
    alt="Profile" 
    className="rounded-full object-cover"
    style={{ width: '59px', height: '56px', opacity: 1 }}
  />
            <div>
              <span className="text-xl font-bold text-gray-800">VedaAI</span>
              <p className="text-xs text-gray-500">AI Teaching Platform</p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <Link 
            href="/create" 
            className="group flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl text-sm font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> 
            New Assignment
            <Sparkles size={14} className="text-yellow-400" />
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ icon: Icon, label, active, href }) => (
            <Link 
              key={label} 
              href={href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                active 
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} /> {label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-100 mt-auto">
          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-2xl transition-all group"
          >
            <div className="relative">
              <img 
                src="/avataat.png" 
                alt="Profile" 
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all" 
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-gray-800">{currentProfile.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <School size={10} /> {currentProfile.school}
              </p>
            </div>
            <ChevronDown size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:ml-72 flex flex-col min-h-screen">
        
        {/* Enhanced Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
          <div className="px-4 lg:px-6 py-4 flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu size={22} className="text-gray-700" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Home size={16} className="text-orange-400" />
              <span className="text-gray-500">Home</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-semibold">Dashboard</span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* View Mode Toggle - Enhanced */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-md text-orange-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid3x3 size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-md text-orange-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FileText size={16} />
                </button>
              </div>
              
              {/* Stats Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <Activity size={14} className="text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">{stats.total}</span>
                <span className="text-xs text-emerald-600">Active</span>
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors group">
                <Bell size={20} className="text-gray-600 group-hover:text-gray-800" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>
              
              {/* Profile Button */}
              <button 
                onClick={() => setIsProfileModalOpen(true)} 
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-all group"
              >
                <img 
                  src="/avataat.png" 
                  alt="Profile" 
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all" 
                />
                <span className="hidden md:block text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                  {currentProfile.name}
                </span>
                <ChevronDown size={14} className="hidden md:block text-gray-400 group-hover:text-orange-500 transition-colors" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 lg:px-6 py-6 pb-24 lg:pb-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
              <p className="text-gray-500 text-sm">Loading your assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-1">My Assignments</h1>
                <p className="text-gray-600 text-sm">Manage and track all your AI-generated question papers</p>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, icon: Icon, color }) => (
                  <div 
                    key={label} 
                    className="relative overflow-hidden bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${color}`}>
                        <Icon size={16} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
                      <p className="text-xs text-gray-500 font-medium">{label} Assignments</p>
                    </div>
                    <div className={`absolute top-0 right-0 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity`}>
                      <Icon size={80} className="text-gray-900" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Search and Filter */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search assignments by title..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl text-sm text-gray-800 bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-50 transition-all outline-none" 
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                  {['all', 'completed', 'generating', 'draft', 'failed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2.5 text-sm rounded-xl capitalize whitespace-nowrap font-medium transition-all ${
                        filterStatus === status 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200 scale-105' 
                          : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600'
                      }`}
                    >
                      {status === 'all' ? 'All' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Assignment Display */}
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-16">
                  <Search size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No assignments found matching your criteria</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                    className="mt-3 text-orange-500 hover:text-orange-600 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAssignments.map((a) => (
                    <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAssignments.map((a) => (
                    <div 
                      key={a._id} 
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText size={16} className="text-gray-400" />
                          <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                            {a.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-9">
                          <StatusBadge status={a.status} />
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.status === 'completed' && (
                          <Link 
                            href={`/assignment/${a._id}`} 
                            className="p-2.5 hover:bg-orange-50 rounded-xl text-orange-500 hover:text-orange-600 transition-colors"
                          >
                            <Eye size={16} />
                          </Link>
                        )}
                        <button 
                          onClick={() => handleDelete(a._id)} 
                          className="p-2.5 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Enhanced Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 py-3 px-4 z-30 shadow-2xl">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {[
            { icon: Home, label: 'Home', href: '/', active: true },
            { icon: BookOpen, label: 'Tasks', href: '/dashboard' },
            { icon: Plus, label: 'Create', href: '/create', special: true },
            { icon: Brain, label: 'AI Tools', href: '/toolkit' },
            { icon: UserCircle2, label: 'Profile', action: true },
          ].map(({ icon: Icon, label, href, active, special, action }) => (
            action ? (
              <button 
                key={label} 
                onClick={() => setIsProfileModalOpen(true)} 
                className="flex flex-col items-center gap-1 py-1.5 px-3 text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ) : special ? (
              <Link 
                key={label} 
                href={href} 
                className="flex flex-col items-center gap-1 px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl -mt-6 shadow-xl shadow-orange-200 hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                <Plus size={22} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            ) : (
              <Link 
                key={label} 
                href={href} 
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                  active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  );
}