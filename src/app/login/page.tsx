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
import React, { useTransition } from 'react';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { loginSchema } from '@/lib/schema';
import { FirebaseClientProvider, useAuth } from '@/firebase';
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
import { signInAnonymously } from 'firebase/auth';

function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const auth = useAuth();

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

  function onSubmit(values: z.infer<typeof loginSchema>) {
    startTransition(async () => {
      try {
        // En un prototipo, cualquier usuario puede entrar con sesión anónima
        // para que el AuthGuard lo deje pasar y la información se guarde en Firestore
        await signInAnonymously(auth);
        router.push('/dashboard');
      } catch (e: any) {
        console.error('Error al iniciar sesión:', e);
      }
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
            Selecciona tu usuario e introduce tu contraseña. (Ingreso Seguro)
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
              <Button type="submit" className="w-full !mt-6" disabled={isPending}>
                 {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ingresar
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
