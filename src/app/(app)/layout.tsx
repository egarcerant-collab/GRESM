
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ShieldCheck } from 'lucide-react';
import React from 'react';
import type { User } from '@/lib/types';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user to allow navigation to all sections, including admin, since login is removed.
  const mockUser: Omit<User, 'password' | 'signature'> = {
    username: 'admin',
    fullName: 'Admin User',
    role: 'admin',
    cargo: 'Administrator'
  };

  return (
    <SidebarProvider>
      <AppSidebar user={mockUser} />
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
            {/* UserMenu removed as there is no login system */}
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
