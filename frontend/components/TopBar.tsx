import React from 'react';
import Link from 'next/link';
import { Bell, ChevronDown, ChevronLeft } from 'lucide-react';

interface TopBarProps {
  backHref?: string;
  backLabel?: string;
  breadcrumb?: React.ReactNode;
}

export default function TopBar({ backHref, backLabel, breadcrumb }: TopBarProps) {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
      {/* Back Button */}
      {backHref ? (
        <Link 
          href={backHref} 
          className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 active:scale-95"
        >
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <button className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 3L5 9L11 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Back Label - Hidden on mobile */}
      {backLabel && (
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="8.5" y="1" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="1" y="8.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="8.5" y="8.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
          </svg>
          {backLabel}
        </div>
      )}

      {/* Breadcrumb - Hidden on mobile */}
      {breadcrumb && (
        <div className="hidden sm:block text-sm text-gray-500">
          {breadcrumb}
        </div>
      )}

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 active:scale-95">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* Profile Section */}
        <div className="flex items-center gap-2 cursor-pointer group">
          {/* Profile Image */}
          <div className="relative">
            <img 
              src="/avatar.png" 
              alt="John Doe" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-orange-300 transition-all duration-200"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1 ring-white" />
          </div>
          
          {/* User Info - Hidden on mobile */}
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-700 leading-tight">John Doe</p>
            <p className="text-xs text-gray-400 leading-tight">Administrator</p>
          </div>
          
          {/* Chevron - Hidden on mobile */}
          <ChevronDown size={14} className="hidden sm:block text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </header>
  );
}