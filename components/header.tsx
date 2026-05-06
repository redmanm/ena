// header.tsx - Fully responsive with removed date/time on mobile
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, User, LogOut, Settings, ChevronDown, Clock } from 'lucide-react';

// Company colors
const COLORS = {
  primary: '#00a2ad',
  primaryDark: '#158798',
  gradient: 'linear-gradient(135deg, #00a2ad 0%, #158798 100%)',
};

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Only show notifications for Manager role
  const showNotificationIcon = user?.role === 'Manager';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = now.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentDate(formattedDate);
      setCurrentTime(formattedTime);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user || !user.departmentId || !showNotificationIcon) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const json = await res.json();
        if (json.success && json.data) {
          setNotifications(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [user, showNotificationIcon]);

  const markNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' });
      setNotifications([]);
      setShowNotifications(false);
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <>
      <header
        className="fixed top-0 right-0 left-0 lg:left-64 h-16 flex items-center justify-between px-4 lg:px-6 z-40 shadow-lg transition-all duration-300"
        style={{ background: COLORS.gradient }}
      >
        {/* Left section - Menu Button and Title */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <span className="sr-only">Toggle menu</span>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Title - hidden on very small screens, shows only logo */}
          <div className="hidden sm:block">
            <div className="text-base font-bold text-white tracking-wide">{t('header.title')}</div>
            <div className="text-xs text-white/80 hidden lg:block">{t('header.subtitle')}</div>
          </div>

          {/* Mobile title - only visible on very small screens */}
          <div className="block sm:hidden">
            <div className="text-sm font-bold text-white tracking-wide">{t('header.mobileTitle')}</div>
          </div>
        </div>

        {/* Center - Date & Time - Hidden on mobile, visible on desktop */}
        {!isMobile && (
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:block">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/15 rounded-xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">{currentDate}</span>
              </div>
              <div className="w-px h-4 bg-white/30"></div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">{currentTime}</span>
              </div>
            </div>
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications - Only for Managers */}
          {showNotificationIcon && (
            <div className="relative">
              <button
                className="relative p-2 hover:bg-white/15 rounded-full transition-all duration-200"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#158798]" />
                        <h3 className="font-semibold text-gray-800">{t('common.notifications')}</h3>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={markNotificationsRead}
                          className="text-xs text-[#158798] hover:text-[#0e6a78] font-medium transition-colors"
                        >
                          {t('common.markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">{t('common.noNewNotifications')}</p>
                          <p className="text-xs text-gray-400 mt-1">{t('common.youreAllCaughtUp')}</p>
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-default transition-colors ${idx === 0 ? 'bg-teal-50/30' : ''}`}>
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#158798] mt-1.5"></div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1.5">
                                  {new Date(n.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 lg:gap-3 cursor-pointer group px-2 py-1 rounded-xl hover:bg-white/15 transition-all duration-200">
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/30 group-hover:ring-white/50 transition-all bg-white/20">
                  <span className="text-xs lg:text-sm font-bold text-white">
                    {user.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="text-xs text-white/80 capitalize">{user.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/70 hidden md:block group-hover:text-white transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 lg:w-72 rounded-xl shadow-2xl border border-gray-100 mt-2 p-1">
              <div className="px-4 py-3 mb-1 rounded-lg bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: COLORS.gradient }}>
                    <span className="text-sm font-bold text-white">
                      {user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-[#158798] mt-0.5 font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors my-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{t('common.myProfile')}</span>
                </Link>
              </DropdownMenuItem>



              <div className="h-px bg-gray-100 my-1"></div>

              <DropdownMenuItem asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 cursor-pointer rounded-lg transition-colors my-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('common.logout')}</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
