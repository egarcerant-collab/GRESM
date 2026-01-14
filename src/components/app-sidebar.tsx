'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
} from '@/components/ui/sidebar';
import { FilePlus, List, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold font-headline text-primary group-data-[collapsible=icon]:hidden">
              Audit Logger
            </span>
          </Link>
        </SidebarHeader>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/dashboard'}
              tooltip="New Audit"
            >
              <Link href="/dashboard">
                <FilePlus />
                <span>New Audit</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/logs')}
              tooltip="Audit Log"
            >
              <Link href="/logs">
                <List />
                <span>Audit Log</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
