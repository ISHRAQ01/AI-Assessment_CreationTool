import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Home,
  Users,
  BookOpen,
  Wrench,
  Library,
  Settings,
  Sparkles,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { useAssignmentStore } from '@/store/AssignmentStore';

// ── VedaAI brand logo ──────────────────────────────────────────────
function VedaLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #FF6B35 0%, #E84646 100%)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          color: '#fff',
          fontWeight: 900,
          fontSize: size * 0.5,
          fontFamily: 'Georgia, serif',
        }}
      >
        V
      </span>
    </div>
  );
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number | null;
}

interface SidebarProps {
  ctaLabel?: string;
  ctaHref?: string;
  ctaGradient?: string;
}

export default function Sidebar({
  ctaLabel = 'Create Assignment',
  ctaHref = '/create',
  ctaGradient = 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
}: SidebarProps) {
  const router = useRouter();
  const { assignments } = useAssignmentStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'My Groups', href: '/groups' },
    {
      icon: BookOpen,
      label: 'Assignments',
      href: '/assignments',
      badge: assignments.length || null,
    },
    { icon: Wrench, label: "AI Teacher's Toolkit", href: '/toolkit' },
    { icon: Library, label: 'My Library', href: '/library' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return router.pathname === '/';
    if (href === '/assignments')
      return (
        router.pathname === '/assignments' ||
        router.pathname.startsWith('/assignment/')
      );
    return router.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img 
            src="/icon.png" 
            alt="VedaAI Logo" 
            className="rounded-full object-cover"
            style={{ width: '40px', height: '40px' }}
          />
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            VedaAI
          </span>
        </Link>
        {/* Mobile close */}
        <button
          className="md:hidden p-1 text-gray-400 hover:text-gray-700"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* CTA Button */}
      <div className="px-4 pb-5">
        <Link
          href={ctaHref}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: ctaGradient,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <Sparkles size={15} />
          {ctaLabel}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ icon: Icon, label, href, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon
                size={16}
                className={active ? 'text-gray-700' : 'text-gray-400'}
              />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B35, #E84646)',
                    minWidth: 20,
                    textAlign: 'center',
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-0.5">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            router.pathname === '/settings'
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Settings
            size={16}
            className={
              router.pathname === '/settings'
                ? 'text-gray-700'
                : 'text-gray-400'
            }
          />
          Settings
        </Link>

        <div className="mt-3 mx-1 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
          <img 
            src="/avatar.png" 
            alt="School" 
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              Delhi Public School
            </p>
            <p className="text-xs text-gray-400 truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex-col fixed h-full z-20 shadow-sm hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger trigger */}
      <button
        className="md:hidden fixed top-3 left-3 z-30 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-20"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden w-72 bg-white border-r border-gray-100 flex flex-col fixed h-full z-30 shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}