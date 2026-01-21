'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useCollection<T = any>(
  memoizedTargetRefOrQuery:
    | ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean })
    | null
    | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  // OJO: este throw puede tumbarte la app en producción si por cualquier razón no se marca __memo.
  // Mejor que sea un console.error, o al menos un error “limpio”.
  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Firestore query/ref no memoizada: usa useMemoFirebase(...) para estabilizar referencias.');
  }

  useEffect(() => {
    let active = true;

    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!active) return;

        const results: WithId<T>[] = snapshot.docs.map((d) => ({
          ...(d.data() as T),
          id: d.id,
        }));

        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (_fbError: FirestoreError) => {
        if (!active) return;

        // Saca path SOLO si se puede; si no, no te caigas.
        let path = 'unknown';
        try {
          // CollectionReference sí tiene .path público
          if ((memoizedTargetRefOrQuery as any).path) {
            path = (memoizedTargetRefOrQuery as CollectionReference).path;
          }
        } catch {
          path = 'unknown';
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        queueMicrotask(() => {
          if (active) errorEmitter.emit('permission-error', contextualError);
        });
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
