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
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    // Using console.error instead of throwing, as it's safer in production.
    console.error('Firestore query/ref no memoizada: usa useMemoFirebase(...) para estabilizar referencias.');
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

        let path = 'unknown';
        try {
          if ((memoizedTargetRefOrQuery as any).path) {
            path = (memoizedTargetRefOrQuery as CollectionReference).path;
          }
        } catch {
          // If we can't get the path, we just use 'unknown'.
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        // Emit the error globally for the listener to catch
        errorEmitter.emit('permission-error', contextualError);

        // Also set local error for graceful degradation in the component
        setError(contextualError);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
