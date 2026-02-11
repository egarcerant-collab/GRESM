'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import React, { useTransition, useState, useEffect } from 'react';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { loginSchema } from '@/lib/schema';
import { useFirebase, useUser, FirebaseClientProvider } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import mockUsers from '@/lib/data/users.json';


function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Use local mock data instead of Firestore
  const { data: users, isLoading: usersLoading, error: usersError } = {
    data: mockUsers as UserProfile[],
    isLoading: false,
    error: null,
  };

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    // With mock auth, user is immediately available, so this will redirect.
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);
  
  // Since we are using mock auth, this component might not even be visible for long.
  if (isUserLoading || user) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  // The onSubmit logic is now moot because we are using a hardcoded mock user in the provider.
  // However, leaving it here doesn't hurt, as the component will redirect away anyway.
  function onSubmit(values: z.infer<typeof loginSchema>) {
    startTransition(async () => {
      // This logic will likely not run due to mock auth redirect.
      toast({
          variant: 'destructive',
          title: 'Error de Inicio de Sesión',
          description: 'El inicio de sesión está deshabilitado en modo de demostración. Redirigiendo...',
      });
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center gap-4 mb-8">
            <ShieldCheck className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold font-headline text-primary">Audit Logger</h1>
        </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <KeyRound />
            Acceder al Sistema
          </CardTitle>
          <CardDescription>
            Selecciona tu usuario e introduce tu contraseña. (Modo Demostración)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={usersLoading || !!usersError}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione un usuario" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="admin">Administrador (admin)</SelectItem>
                            {users && users.filter(u => u && u.username && u.username !== 'admin' && !u.username.includes('mock')).map(user => (
                                <SelectItem key={user.uid} value={user.username}>
                                    {user.fullName || user.username}
                                </SelectItem>
                            ))}
                             {users && users.filter(u => u && u.username && u.username.includes('mock')).map(user => (
                                <SelectItem key={user.uid} value={user.username}>
                                    {user.fullName || user.username} (Mock)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {usersLoading && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cargando usuarios...</span>
                        </div>
                    )}
                    {usersError && (
                        <p className="text-sm font-medium text-destructive pt-2">
                            Error al cargar usuarios. Intente recargar.
                        </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Introduce tu contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full !mt-6" disabled={true}>
                Ingresar (Deshabilitado)
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <FirebaseClientProvider>
      <LoginPageContent />
    </FirebaseClientProvider>
  );
}
