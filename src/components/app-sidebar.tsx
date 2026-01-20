
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
import { FilePlus, List, ShieldCheck, Users, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { useMemo, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { Button } from './ui/button';

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      });
    }
  }, [user, firestore]);
  
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
           {profile && (
             <div className="text-xs text-muted-foreground text-left mb-2 p-2 rounded-lg bg-muted">
                <p className="font-bold text-foreground">{profile.fullName}</p>
                <p>{profile.cargo}</p>
             </div>
           )}
           <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
             <LogOut className="mr-2 h-4 w-4" />
             Cerrar Sesión
           </Button>
         </div>

         <div className="text-xs text-muted-foreground p-2 text-center group-data-[collapsible=icon]:hidden">
            <p className='font-bold'>Eduardo Garcerant Gonzalez</p>
            <p>Auditor de la Dirección Nacional de Gestión del Riesgo en Salud Dusakawi EPSI</p>
            <p>Odontólogo General.</p>
            <p>Especialista en Sistemas de Calidad y Auditoría en Salud.</p>
            <p>Magiste en Epidemiologia.</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
