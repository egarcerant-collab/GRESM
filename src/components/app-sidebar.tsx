'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter
} from '@/components/ui/sidebar';
import { FilePlus, LayoutDashboard, List, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';

export function AppSidebar({ user }: { user: Omit<User, 'password' | 'signature'> }) {
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
              tooltip="Indicadores"
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Indicadores</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/audits/new'}
              tooltip="Nueva Auditoría"
            >
              <Link href="/audits/new">
                <FilePlus />
                <span>Nueva Auditoría</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/logs')}
              tooltip="Registro de Auditoría"
            >
              <Link href="/logs">
                <List />
                <span>Registro de Auditoría</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           {user.role === 'admin' && (
            <SidebarMenuItem>
                <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/admin')}
                tooltip="Administración"
                >
                <Link href="/admin">
                    <Users />
                    <span>Administración</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Footer is empty as user info has been removed */}
      </SidebarFooter>
    </Sidebar>
  );
}
