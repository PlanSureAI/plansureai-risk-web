'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { Session } from 'next-auth';
import { useAuth } from '@/app/hooks/useAuth';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  user: any;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const contextValue: AuthContextType = {
    session: auth.session ?? null,
    loading: auth.isLoading,
    user: auth.session?.user ?? null,
    signOut: async () => {
      await auth.logout();
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
