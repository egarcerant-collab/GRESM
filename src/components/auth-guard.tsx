
'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Solo redirigir si no estamos cargando y no hay usuario
    // Y si no estamos ya en la página de login
    if (isMounted && !isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, isMounted, pathname]);

  // Pantalla de carga mientras se verifica la sesión
  if (!isMounted || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Verificando sesión...</p>
        </div>
      </div>
    );
  }
  
  // Si no hay usuario y no es la página de login, mostramos carga mientras redirige
  if (!user && pathname !== '/login') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
