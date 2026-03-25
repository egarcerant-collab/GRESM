'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  DependencyList,
} from 'react';

// ===================== Types =====================

export interface LocalUser {
  uid: string;
  email: string;
  username: string;
  fullName?: string;
  role?: string;
  cargo?: string;
}

interface LocalContextState {
  user: LocalUser | null;
  isUserLoading: boolean;
  signOut: () => void;
}

// ===================== Ref types (replace Firestore refs) =====================

export interface CollectionRef {
  __type: 'collection';
  name: string;
}

export interface DocRef {
  __type: 'doc';
  collection: string;
  id: string;
}

export interface QueryRef {
  __type: 'query';
  collection: string;
  constraints: QueryConstraint[];
}

export interface QueryConstraint {
  field: string;
  op: string;
  value: any;
}

// ===================== Stable singletons =====================

const LOCAL_FIRESTORE = Object.freeze({ __local: true as const });
const LOCAL_APP = Object.freeze({ __localApp: true as const });

// ===================== Data change events =====================

function notifyDataChange(collectionName: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('local-data-change', { detail: { collection: collectionName } })
    );
  }
}

// ===================== Context =====================

const LocalContext = createContext<LocalContextState | undefined>(undefined);

function useLocalContext(): LocalContextState {
  const ctx = useContext(LocalContext);
  if (!ctx) throw new Error('Must be used within LocalProvider');
  return ctx;
}

// ===================== Provider =====================

export function LocalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('local_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setIsUserLoading(false);

    const handleAuthChange = () => {
      const s = localStorage.getItem('local_user');
      setUser(s ? JSON.parse(s) : null);
    };
    window.addEventListener('local-auth-change', handleAuthChange);
    return () => window.removeEventListener('local-auth-change', handleAuthChange);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('local_user');
    setUser(null);
    window.dispatchEvent(new Event('local-auth-change'));
  }, []);

  const value = useMemo(() => ({ user, isUserLoading, signOut }), [user, isUserLoading, signOut]);

  return React.createElement(LocalContext.Provider, { value }, children);
}

// FirebaseClientProvider alias
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(LocalProvider, null, children);
}

// ===================== Hooks =====================

export function useUser() {
  const { user, isUserLoading } = useLocalContext();
  return { user, isUserLoading, userError: null };
}

export function useAuth() {
  const { signOut } = useLocalContext();
  return useMemo(() => ({ signOut, currentUser: null }), [signOut]);
}

export function useFirestore() {
  return LOCAL_FIRESTORE;
}

export function useFirebase() {
  const { user, isUserLoading, signOut } = useLocalContext();
  const auth = useMemo(() => ({ signOut, currentUser: null }), [signOut]);
  return {
    firebaseApp: LOCAL_APP,
    firestore: LOCAL_FIRESTORE,
    auth,
    user,
    isUserLoading,
    userError: null,
  };
}

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

// ===================== Firestore-like functions =====================

export function collection(_db: any, name: string): CollectionRef {
  return { __type: 'collection', name };
}

export function doc(_db: any, col: string, id: string): DocRef {
  return { __type: 'doc', collection: col, id };
}

export function query(ref: CollectionRef, ...constraints: QueryConstraint[]): QueryRef {
  return { __type: 'query', collection: ref.name, constraints };
}

export function where(field: string, op: string, value: any): QueryConstraint {
  return { field, op, value };
}

export async function getDoc(ref: DocRef) {
  try {
    const res = await fetch(`/api/${ref.collection}/${ref.id}`);
    if (!res.ok) return { exists: () => false, data: () => null, id: ref.id };
    const data = await res.json();
    return { exists: () => data !== null, data: () => data, id: ref.id };
  } catch {
    return { exists: () => false, data: () => null, id: ref.id };
  }
}

export async function getDocs(queryOrRef: QueryRef | CollectionRef) {
  const collectionName =
    queryOrRef.__type === 'query' ? queryOrRef.collection : queryOrRef.name;

  let url = `/api/${collectionName}`;

  if (queryOrRef.__type === 'query' && queryOrRef.constraints.length > 0) {
    const params = new URLSearchParams();
    for (const c of queryOrRef.constraints) {
      params.append(c.field, String(c.value));
      params.append(`${c.field}_op`, c.op);
    }
    url += `?${params.toString()}`;
  }

  const res = await fetch(url);
  const items: any[] = await res.json();
  const docs = items.map((item) => ({ id: item.id || item.uid, data: () => item }));
  return { empty: docs.length === 0, docs };
}

// ===================== Non-blocking operations =====================

export function setDocumentNonBlocking(ref: DocRef, data: any, options: { merge?: boolean } = {}) {
  const payload = options.merge ? { ...data, merge: true } : data;
  fetch(`/api/${ref.collection}/${ref.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(() => notifyDataChange(ref.collection))
    .catch(console.error);
}

export function addDocumentNonBlocking(ref: CollectionRef, data: any): Promise<{ id: string }> {
  return fetch(`/api/${ref.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then((result) => {
      notifyDataChange(ref.name);
      return result;
    });
}

export function deleteDocumentNonBlocking(ref: DocRef) {
  fetch(`/api/${ref.collection}/${ref.id}`, { method: 'DELETE' })
    .then(() => notifyDataChange(ref.collection))
    .catch(console.error);
}

export function updateDocumentNonBlocking(ref: DocRef, data: any) {
  fetch(`/api/${ref.collection}/${ref.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, merge: true }),
  })
    .then(() => notifyDataChange(ref.collection))
    .catch(console.error);
}

// ===================== useCollection Hook =====================

export function useCollection<T>(ref: CollectionRef | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const collectionName = ref?.name ?? null;

  const fetchData = useCallback(() => {
    if (!collectionName) return;
    setIsLoading(true);
    fetch(`/api/${collectionName}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setIsLoading(false); })
      .catch((e) => { setError(e); setIsLoading(false); });
  }, [collectionName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.collection === collectionName) fetchData();
    };
    window.addEventListener('local-data-change', handler);
    return () => window.removeEventListener('local-data-change', handler);
  }, [collectionName, fetchData]);

  return { data, isLoading, error };
}

// ===================== useDoc Hook =====================

export function useDoc<T>(ref: DocRef | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const col = ref?.collection ?? null;
  const id = ref?.id ?? null;

  const fetchData = useCallback(() => {
    if (!col || !id) return;
    setIsLoading(true);
    fetch(`/api/${col}/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setIsLoading(false); })
      .catch((e) => { setError(e); setIsLoading(false); });
  }, [col, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.collection === col) fetchData();
    };
    window.addEventListener('local-data-change', handler);
    return () => window.removeEventListener('local-data-change', handler);
  }, [col, fetchData]);

  return { data, isLoading, error };
}

// ===================== Auth functions (Firebase-like API) =====================

export async function signInWithEmailAndPassword(_auth: any, email: string, password: string) {
  const username = email.split('@')[0];
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw { code: 'auth/invalid-credential' };
  }
  const user = await res.json();
  localStorage.setItem('local_user', JSON.stringify(user));
  window.dispatchEvent(new Event('local-auth-change'));
  return { user };
}

export async function createUserWithEmailAndPassword(_auth: any, email: string, password: string) {
  const username = email.split('@')[0];
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw { code: err.error };
  }
  const user = await res.json();
  return { user };
}

// ===================== Error listener no-op =====================

export class FirestorePermissionError extends Error {}
export const errorEmitter = { on: () => {}, off: () => {}, emit: () => {} };
