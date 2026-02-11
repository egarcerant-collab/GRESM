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
import { FilePlus, List, ShieldCheck, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/firebase';
import { Button } from './ui/button';

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  
  const handleLogout = async () => {
    await auth.signOut();
  };

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
              tooltip="Nueva Auditoría"
            >
              <Link href="/dashboard">
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
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2 group-data-[collapsible=icon]:hidden">
           <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
             <LogOut className="mr-2 h-4 w-4" />
             Cerrar Sesión
           </Button>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
