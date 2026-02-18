
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import mockUsers from '@/lib/data/users.json';

export interface FirebaseContextState {
  user: any | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
  login: (username: string) => void;
  logout: () => void;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  const [userAuthState, setUserAuthState] = useState<{
    profile: UserProfile | null;
    isUserLoading: boolean;
  }>({
    profile: null,
    isUserLoading: true,
  });

  useEffect(() => {
    // Verificar si hay una sesión guardada en el navegador
    const savedUserUid = localStorage.getItem('audit-app-session');
    if (savedUserUid) {
      const foundProfile = (mockUsers as UserProfile[]).find(u => u.uid === savedUserUid);
      if (foundProfile) {
        setUserAuthState({ profile: foundProfile, isUserLoading: false });
      } else {
        setUserAuthState({ profile: null, isUserLoading: false });
      }
    } else {
      setUserAuthState({ profile: null, isUserLoading: false });
    }
  }, []);

  const login = (username: string) => {
    const foundProfile = (mockUsers as UserProfile[]).find(u => u.username === username);
    if (foundProfile) {
      localStorage.setItem('audit-app-session', foundProfile.uid);
      setUserAuthState({ profile: foundProfile, isUserLoading: false });
    }
  };

  const logout = () => {
    localStorage.removeItem('audit-app-session');
    setUserAuthState({ profile: null, isUserLoading: false });
  };

  const contextValue = useMemo(() => ({
    user: userAuthState.profile ? { uid: userAuthState.profile.uid } : null,
    profile: userAuthState.profile,
    isUserLoading: userAuthState.isUserLoading,
    userError: null,
    login,
    logout,
  }), [userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useUser = () => {
  const { user, profile, isUserLoading, userError, login, logout } = useFirebase();
  return { user, profile, isUserLoading, userError, login, logout };
};

export const useFirestore = () => ({});
export const useAuth = () => ({});
export const useFirebaseApp = () => ({});

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}
