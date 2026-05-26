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
    <div className="min-h-screen bg-white flex">
      {/* SIDEBAR - Fixed left */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6">
          {/* Logo */}
          <h1 className="text-2xl font-bold text-indigo-600 mb-8">VedaAI</h1>
          
          {/* Navigation */}
          <nav className="space-y-1">
            <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Home</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">My Groups</a>
            <a href="#" className="block px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg font-medium">Assignments</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">AI Teacher's Toolkit</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">My Library</a>
          </nav>

          {/* Settings */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-2">Settings</p>
            <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Settings</a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">Delhi Public School</p>
          <p className="text-xs text-gray-400">Bokaro Steel City</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white px-8 py-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Assignments</span>
          <span className="text-sm text-gray-600">John Doe</span>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Header with Create Button */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Assignment</h2>
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              + Create Assignment
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search Assignment"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Assignments List */}
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-900 font-medium mb-2">No assignments yet</p>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                Create your first assignment to start collecting and grading student submissions. 
                You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>
              <Link
                href="/create"
                className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
              >
                + Create Your First Assignment
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => (
                <div key={assignment._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Assign on: {new Date(assignment.createdAt).toLocaleDateString()} | 
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      {assignment.status === 'completed' && assignment.generatedPaperId && (
                        <Link
                          href={`/assignment/${assignment._id}`}
                          className="text-indigo-600 text-sm hover:text-indigo-800"
                        >
                          View Assignment
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      assignment.status === 'generating' ? 'bg-yellow-100 text-yellow-700' :
                      assignment.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}