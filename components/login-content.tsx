'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getPostLoginPath } from '@/lib/post-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginContent() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user) {
      const nextPath = getPostLoginPath(user);
      window.location.assign(nextPath);
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const nextUser = await login(email, password);
      const nextPath = getPostLoginPath(nextUser);
      window.location.assign(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Animated Line Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Moving gradient lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Animated horizontal lines */}
          <div className="absolute top-[15%] left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00a2ad] to-transparent animate-slide-right opacity-30" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[30%] left-0 w-full h-px bg-gradient-to-r from-transparent via-[#013c4c] to-transparent animate-slide-left opacity-30" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[45%] left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00a2ad] to-transparent animate-slide-right opacity-25" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[60%] left-0 w-full h-px bg-gradient-to-r from-transparent via-[#013c4c] to-transparent animate-slide-left opacity-30" style={{ animationDelay: '4.5s' }} />
          <div className="absolute top-[75%] left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00a2ad] to-transparent animate-slide-right opacity-20" style={{ animationDelay: '6s' }} />
          <div className="absolute top-[90%] left-0 w-full h-px bg-gradient-to-r from-transparent via-[#013c4c] to-transparent animate-slide-left opacity-25" style={{ animationDelay: '7.5s' }} />

          {/* Animated vertical lines */}
          <div className="absolute left-[10%] top-0 w-px h-full bg-gradient-to-b from-transparent via-[#00a2ad] to-transparent animate-slide-down opacity-30" style={{ animationDelay: '1s' }} />
          <div className="absolute left-[30%] top-0 w-px h-full bg-gradient-to-b from-transparent via-[#013c4c] to-transparent animate-slide-up opacity-25" style={{ animationDelay: '2.5s' }} />
          <div className="absolute left-[50%] top-0 w-px h-full bg-gradient-to-b from-transparent via-[#00a2ad] to-transparent animate-slide-down opacity-30" style={{ animationDelay: '4s' }} />
          <div className="absolute left-[70%] top-0 w-px h-full bg-gradient-to-b from-transparent via-[#013c4c] to-transparent animate-slide-up opacity-20" style={{ animationDelay: '5.5s' }} />
          <div className="absolute left-[90%] top-0 w-px h-full bg-gradient-to-b from-transparent via-[#00a2ad] to-transparent animate-slide-down opacity-25" style={{ animationDelay: '7s' }} />

          {/* Diagonal accent lines */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-[#00a2ad]/5 to-transparent rotate-45 blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-[#013c4c]/5 to-transparent rotate-45 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </div>

      {/* Compact Form Container - no vertical scroll on 1080p */}
      <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20 relative z-10 my-8">

        {/* LEFT COLUMN - Compact Welcome Section */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#013c4c] via-[#013c4c] to-[#00a2ad] p-8 flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24" />

          <div className="relative z-10 w-full">
            {/* Logo - Compact */}
            <div className="mb-6 flex justify-center">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ena_logo-removebg-preview-9RC5JsQ7iZ2CcC4NnPjN2o0y8OzB03.png"
                alt="ENA Logo"
                className="w-28 h-28 object-contain drop-shadow-2xl brightness-0 invert"
              />
            </div>

            {/* Welcome text - Compact */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white mb-1">Welcome to</h1>
              <h1 className="text-2xl font-bold text-white">Visitor Management System</h1>
            </div>
            <div className="w-20 h-0.5 bg-white/50 mx-auto mb-6 rounded-full" />

            {/* Features list - Compact */}
            <div className="space-y-3 mt-6 max-w-xs mx-auto">
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>{t('dashboard.checkIns')}</span>
              </div>

              <div className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span>{t('common.notifications')}</span>
              </div>

              <div className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span>{t('auditTrail.title')}</span>
              </div>
            </div>

            {/* User stats - Compact */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center justify-center gap-2 text-white/80 text-xs">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-bold backdrop-blur-sm">
                      👤
                    </div>
                  ))}
                </div>
                <span>100+ active users</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Compact Login Form */}
        <div className="w-full md:w-1/2 p-6 lg:p-8 bg-gradient-to-br from-white to-gray-50/50 flex flex-col justify-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00a2ad]/5 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#013c4c]/5 to-transparent rounded-full blur-2xl" />

          <div className="flex justify-center mb-4 md:hidden">
            <img
              src="logo.png"
              alt="ENA Logo"
              className="w-22 h-20 object-contain"
            />
          </div>

          <div className="max-w-sm mx-auto w-full relative z-10">
            {/* Language Switcher in top right corner on login */}
            <div className="absolute top-4 right-4">
              <LanguageSwitcher />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                {t('login.title')}
              </h2>
              <p className="text-gray-500 text-sm">{t('login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('login.email')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <svg className="h-4 w-4 text-gray-400 group-focus-within:text-[#00a2ad] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-10 rounded-lg border-gray-200 focus:border-[#00a2ad] focus:ring-[#00a2ad]/30 transition-all duration-300 bg-white shadow-sm text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('login.password')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <svg className="h-4 w-4 text-gray-400 group-focus-within:text-[#00a2ad] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-10 h-10 rounded-lg border-gray-200 focus:border-[#00a2ad] focus:ring-[#00a2ad]/30 transition-all duration-300 bg-white shadow-sm text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-300"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.114a1 1 0 10-1.414 1.414m6.364 6.364a1 1 0 10-1.414-1.414M9 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 animate-shake">
                  <p className="text-red-700 text-xs flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-gradient-to-r from-[#00a2ad] to-[#013c4c] hover:from-[#013c4c] hover:to-[#00a2ad] text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('login.signingIn')}
                  </div>
                ) : (
                  t('login.loginButton')
                )}
              </Button>

              {/* Decorative divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-400 text-[10px]">Secure access</span>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                © {currentYear} ENA. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out 0s 2;
        }
        
        @keyframes slide-right {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes slide-left {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        
        @keyframes slide-down {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        
        @keyframes slide-up {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: rotate(45deg) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: rotate(45deg) scale(1.05);
          }
        }
        
        .animate-slide-right {
          animation: slide-right 8s ease-in-out infinite;
        }
        
        .animate-slide-left {
          animation: slide-left 8s ease-in-out infinite;
        }
        
        .animate-slide-down {
          animation: slide-down 10s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 10s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
