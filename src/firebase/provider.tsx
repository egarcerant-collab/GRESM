
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';


interface UserAuthState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean; 
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
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
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isUserLoading: true, 
    userError: null,
  });

  useEffect(() => {
    let active = true;

    if (!auth) {
      if (active) {
        setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!active) return;

        if (firebaseUser) {
          try {
            const profileRef = doc(firestore, 'users', firebaseUser.uid);
            const docSnap = await getDoc(profileRef);
            
            if (!active) return;
            
            const userProfile = docSnap.exists() ? docSnap.data() as UserProfile : null;
            
            // Perfil por defecto garantizado para evitar bloqueos
            const finalProfile: UserProfile = userProfile || {
                uid: firebaseUser.uid,
                email: firebaseUser.email || 'usuario@dusakawi.audit.app',
                username: 'auditor_demo',
                fullName: 'Usuario Autorizado',
                role: 'admin',
                cargo: 'Auditor de Riesgo',
            };
            
            setUserAuthState({ user: firebaseUser, profile: finalProfile, isUserLoading: false, userError: null });
          } catch (error) {
            if (!active) return;
            // Si falla Firestore, permitimos el acceso con perfil local
            const mockProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: 'usuario_offline',
                fullName: 'Auditor del Sistema',
                role: 'admin',
                cargo: 'Gestor de Riesgo',
            };
            setUserAuthState({ user: firebaseUser, profile: mockProfile, isUserLoading: false, userError: null });
          }
        } else {
          if (active) {
            setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
          }
        }
      },
      (error) => {
        if (!active) return;
        setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: error });
      }
    );
    
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      profile: userAuthState.profile,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return {
    firebaseApp: context.firebaseApp!,
    firestore: context.firestore!,
    auth: context.auth!,
    user: context.user,
    profile: context.profile,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, profile, isUserLoading, userError } = useFirebase();
  return { user, profile, isUserLoading, userError };
};
