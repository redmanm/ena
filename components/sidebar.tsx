// sidebar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getVisibleMenuItems } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const menuIcons: Record<string, React.ReactNode> = {
  Dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'All Appointments': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  'Department Appointments': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  "Today's Appointments": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'Create Appointment': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  'Walk-in Appointment': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  'User Management': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  'Department Management': (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'Check-in Queue': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  'Visitors Inside': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'Visit History': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  History: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'View History': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Reports: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  'Audit Trail': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const currentYear = new Date().getFullYear();

  if (!user) return null;

  const visibleItems = getVisibleMenuItems(user.role);

  const isItemActive = (itemHref: string) => {
    return pathname === itemHref;
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-[#013c4c] flex flex-col shadow-2xl z-50 transition-transform duration-300",
          !isOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors lg:hidden z-20"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#00a2ad]/30 rounded-full animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00a2ad]/5 via-transparent to-transparent animate-shimmer" />
          <div className="absolute top-1/2 left-0 w-full h-32 bg-gradient-to-r from-transparent via-[#00a2ad]/5 to-transparent animate-slow-wave" />
        </div>

        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00a2ad] via-[#00a2ad]/50 to-[#00a2ad]" />

        <div className="relative z-10 flex items-center justify-center px-4 h-16 border-b border-[#00a2ad]/20 flex-shrink-0">
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-[#00a2ad]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src="/logo.png"
              alt="ENA Logo"
              className="h-full w-auto object-contain brightness-0 invert drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <nav className="relative z-10 flex-1 overflow-y-auto py-5 px-2.5 space-y-1">
          {visibleItems.map((item) => {
            const isActive = isItemActive(item.href);
            const isLongText = item.label === 'Department Management';
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium',
                  'hover:translate-x-0.5',
                  isActive
                    ? 'bg-gradient-to-r from-[#00a2ad] to-[#00a2ad]/80 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/5',
                  isLongText && 'text-xs'
                )}
              >
                <span className={cn(
                  'transition-all duration-300',
                  'group-hover:scale-105',
                  isActive && 'scale-105',
                  'flex-shrink-0'
                )}>
                  {menuIcons[item.label] || (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </span>
                <span className={cn(
                  'font-medium tracking-wide whitespace-nowrap',
                  isLongText ? 'text-xs' : 'text-sm'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 p-3 border-t border-[#00a2ad]/20 flex-shrink-0 space-y-2.5">
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm">Logout</span>
          </button>
          <div className="text-center">
            <p className="text-[9px] text-white/40 font-medium tracking-wider">
              © {currentYear} ENA. All rights reserved.
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
            50% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%); }
            100% { transform: translateX(100%) translateY(100%); }
          }
          @keyframes slow-wave {
            0% { transform: translateX(-100%) translateY(0); opacity: 0; }
            50% { opacity: 0.3; }
            100% { transform: translateX(100%) translateY(0); opacity: 0; }
          }
          .animate-float { animation: float 8s ease-in-out infinite; }
          .animate-shimmer { animation: shimmer 12s ease-in-out infinite; }
          .animate-slow-wave { animation: slow-wave 10s ease-in-out infinite; }
          nav::-webkit-scrollbar { width: 3px; }
          nav::-webkit-scrollbar-track { background: rgba(0, 162, 173, 0.1); border-radius: 10px; }
          nav::-webkit-scrollbar-thumb { background: rgba(0, 162, 173, 0.5); border-radius: 10px; }
        `}</style>
      </aside>
    </>
  );
}