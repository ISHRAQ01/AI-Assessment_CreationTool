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
    <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
      {backHref ? (
        <Link href={backHref} className="p-1.5 text-gray-400 hover:text-gray-600">
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <button className="p-1.5 text-gray-400 hover:text-gray-600">
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

      {backLabel && (
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="8.5" y="1" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="1" y="8.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="8.5" y="8.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.5" />
          </svg>
          {backLabel}
        </div>
      )}

      {breadcrumb && <div className="text-sm text-gray-400">{breadcrumb}</div>}

      <div className="ml-auto flex items-center gap-4">
        <div className="relative">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">
            1
          </span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          {/* Profile Image - Using avatar.png */}
          <img 
            src="/avatar.png" 
            alt="John Doe" 
            className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
          />
          <span className="text-sm font-medium text-gray-700 hidden sm:block">John Doe</span>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
}