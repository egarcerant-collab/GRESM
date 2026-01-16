
'use client';

import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ShieldCheck, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UserMenu } from '@/components/user-menu';
import { getCurrentUser } from '@/app/actions';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<Omit<User, 'password'|'signature'> | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        console.error("Failed to fetch user, relying on middleware to redirect.", e);
        // If there's an error, we can't get user info, but we won't redirect here.
        // The middleware is the source of truth for auth enforcement.
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [pathname]);

  if (loading || !user) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className='md:hidden'>
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold font-headline">Audit Logger</h1>
          </div>
          <div className="flex w-full items-center justify-end gap-4">
            <UserMenu user={user} />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
