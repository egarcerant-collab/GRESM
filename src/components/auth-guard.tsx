'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // This effect runs once on the client to set isClient to true.
  // It ensures that any logic depending on client-side state runs after hydration.
  useEffect(() => {
    setIsClient(true);
  }, []);

  // This effect handles redirection based on auth state.
  useEffect(() => {
    // Only run redirection logic on the client and after the initial auth check.
    if (isClient && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, isClient]);

  // On the server, or on the client before hydration and auth check, show a loader.
  if (!isClient || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If auth check is complete but there's no user, we are about to redirect.
  // Render the loader to avoid a flash of content.
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If we are on the client, auth is loaded, and a user exists, render the children.
  return <>{children}</>;
}
