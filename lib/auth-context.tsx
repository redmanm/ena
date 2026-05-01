'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const j = await res.json();
        if (res.ok && j.user) setUser(j.user);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json();
    if (!res.ok) {
      const msg = typeof j?.error === 'string' ? j.error : 'Login failed';
      const code = typeof j?.code === 'string' ? j.code : undefined;
      throw new Error(code ? `${msg} (${code})` : msg);
    }
    setUser(j.user);
    return j.user as User;
  };

  const logout = () => {
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  const refresh = async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const j = await res.json();
    if (res.ok && j.user) setUser(j.user);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
