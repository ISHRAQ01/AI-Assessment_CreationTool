import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAssignmentStore } from '@/store/AssignmentStore';
import { useWebSocket } from '@/hooks/UseWebSocket';

export default function Dashboard() {
  const { assignments, setAssignments, updateAssignment, isLoading, setIsLoading } = useAssignmentStore();
  const { lastMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    // Handle WebSocket real-time updates
    if (lastMessage && lastMessage.type === 'GENERATION_COMPLETED') {
      updateAssignment(lastMessage.assignmentId, { 
        status: 'completed', 
        generatedPaperId: lastMessage.questionPaperId 
      });
    } else if (lastMessage && lastMessage.type === 'GENERATION_FAILED') {
      updateAssignment(lastMessage.assignmentId, { status: 'failed' });
    }
  }, [lastMessage, updateAssignment]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/assignments');
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await axios.delete(`/api/assignments/${id}`);
      useAssignmentStore.getState().deleteAssignment(id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">VedaAI</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Delhi Public School</span>
              <span className="text-sm text-gray-500">Bokaro Steel City</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sidebar + Main Content */}
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {['Home', 'My Groups', 'Assignments', "AI Teacher's Toolkit", 'My Library'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                    item === 'Assignments'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
              <Link
                href="/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                + Create Assignment
              </Link>
            </div>

            <p className="text-gray-600 mb-6">Manage and create assignments for your classes.</p>

            {/* Search and Filter */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search Assignment"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Assignments Grid */}
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-4">No assignments yet</p>
                <p className="text-sm text-gray-400 mb-6">
                  Create your first assignment to start collecting and grading student submissions.
                </p>
                <Link
                  href="/create"
                  className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Create Your First Assignment
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssignments.map((assignment) => (
                  <div key={assignment._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition">
                    <h3 className="font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                    <div className="text-sm text-gray-500 mb-2">
                      <div>Assign on: {new Date(assignment.createdAt).toLocaleDateString()}</div>
                      <div>Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        assignment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {assignment.status === 'completed' && assignment.generatedPaperId && (
                        <Link
                          href={`/assignment/${assignment._id}`}
                          className="flex-1 text-center text-indigo-600 text-sm font-medium hover:text-indigo-800"
                        >
                          View Assignment
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-600 text-sm font-medium hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}