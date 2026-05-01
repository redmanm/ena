'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/lib/types';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallbackMessage?: string;
  fallbackUrl?: string;
}

export function ProtectedPage({ 
  children, 
  requiredRoles,
  fallbackMessage = 'You do not have permission to access this page.',
  fallbackUrl = '/dashboard'
}: ProtectedPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !requiredRoles.includes(user.role))) {
      router.push(fallbackUrl);
    }
  }, [user, isLoading, requiredRoles, router, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !requiredRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 px-4">
        <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full text-center">
          <svg className="w-12 h-12 text-destructive mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.172 6.172a4 4 0 015.656 0l4.243 4.243a4 4 0 010 5.656l-4.243 4.243a4 4 0 11-5.656-5.656l4.243-4.243a4 4 0 010-5.656z" />
          </svg>
          <h1 className="text-lg font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-6">{fallbackMessage}</p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
