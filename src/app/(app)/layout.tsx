
'use client';

import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { UserMenu } from '@/components/user-menu';
import type { User } from '@/lib/types';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hardcoded mock user to bypass login.
  const user: Omit<User, 'password'|'signature'> = {
    username: 'eg',
    fullName: 'EG (Admin)',
    role: 'admin',
    cargo: 'Mega Usuario'
  };

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
