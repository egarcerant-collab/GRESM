'use client';

import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGuard } from '@/components/auth-guard';

function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className='md:hidden'>
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold font-headline">Audit Logger</h1>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <AuthGuard>
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
      </AuthGuard>
    </FirebaseClientProvider>
  )
}
