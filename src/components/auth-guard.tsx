'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // This effect runs once on the client to set isMounted to true.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // This effect handles redirection based on auth state, but only after client mount.
  useEffect(() => {
    // Only run redirection logic on the client and after the initial auth check.
    if (isMounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, isMounted]);

  // On the server, or on the client before it has mounted, or while auth is loading,
  // show a loader. This is the crucial step to prevent any hydration mismatch.
  if (!isMounted || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If, after all checks, there is still no user, we are about to redirect.
  // Render the loader to avoid a flash of content while redirecting.
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only if we are on the client, auth is loaded, and a user exists, render the children.
  return <>{children}</>;
}
