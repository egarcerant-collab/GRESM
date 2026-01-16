// This hook is no longer used.
'use client';

import { createContext, useContext } from 'react';
import type { User } from '@/lib/types';

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
};

export const useAuth = (): AuthContextType => ({ 
    user: null, 
    loading: true,
    login: async () => {},
    logout: async () => {},
    refetchUser: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
