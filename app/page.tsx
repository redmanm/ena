'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        {/* ENA Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/ena-logo.png"
            alt="ENA Logo"
            className="h-32 w-auto"
          />
        </div>

        {/* Animated Loading Indicator */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#17A2B8] border-r-[#17A2B8] animate-spin"
              style={{
                borderTopColor: '#17A2B8',
                borderRightColor: '#17A2B8',
              }}
            />
            <div
              className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#17A2B8] opacity-50 animate-spin"
              style={{
                borderBottomColor: '#17A2B8',
                animationDirection: 'reverse',
              }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-[#17A2B8] font-medium text-lg tracking-wide">
          Loading...
        </p>
      </div>
    </div>
  );
}
