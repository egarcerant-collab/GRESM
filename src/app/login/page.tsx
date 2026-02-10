
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
import { useFirebase, useUser, FirebaseClientProvider, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { collection, doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading, error: usersError } = useCollection<UserProfile>(usersCollection);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);
  
  if (isUserLoading || user) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  function onSubmit(values: z.infer<typeof loginSchema>) {
    startTransition(async () => {
        const email = `${values.username}@dusakawi.audit.app`;

        if (values.username === 'admin') {
             if (values.password !== '123456') {
                toast({
                    variant: 'destructive',
                    title: 'Error de Inicio de Sesión',
                    description: 'La contraseña del administrador es incorrecta.',
                });
                return;
            }
            try {
                await signInWithEmailAndPassword(auth, email, values.password);
                toast({ title: 'Inicio de Sesión Exitoso', description: 'Bienvenido de nuevo, Admin.' });
            } catch (error: any) {
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
                        const newUser = userCredential.user;

                        const userProfile: UserProfile = {
                            uid: newUser.uid,
                            email: newUser.email!,
                            username: 'admin',
                            fullName: 'Administrador',
                            role: 'admin',
                            cargo: 'Administrador del Sistema',
                        };

                        setDocumentNonBlocking(doc(firestore, "users", newUser.uid), userProfile, {});
                        
                        toast({ title: 'Cuenta de Admin Creada', description: 'Se ha creado la cuenta de administrador. ¡Bienvenido!' });
                    } catch (creationError: any) {
                        let description = 'No se pudo iniciar sesión ni crear la cuenta de admin. Es posible que la cuenta ya exista con una contraseña diferente.';
                        if(creationError.code === 'auth/email-already-in-use'){
                            description = 'La contraseña del administrador es incorrecta. No se pudo restablecer.';
                        }
                        toast({
                            variant: 'destructive',
                            title: 'Error de Inicio de Sesión',
                            description: description,
                        });
                    }
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error de Inicio de Sesión',
                        description: error.message || 'Ocurrió un error inesperado.',
                    });
                }
            }
        } else {
            if (!values.username) {
                toast({
                    variant: 'destructive',
                    title: 'Error de Inicio de Sesión',
                    description: 'Por favor, seleccione un usuario.',
                });
                return;
            }
            try {
                await signInWithEmailAndPassword(auth, email, values.password);
                toast({ title: 'Inicio de Sesión Exitoso', description: 'Bienvenido de nuevo.' });
            } catch (error: any) {
                 let message = "Credenciales incorrectas.";
                 if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                    message = 'El usuario o la contraseña son incorrectos.';
                 }
                 toast({
                    variant: 'destructive',
                    title: 'Error de Inicio de Sesión',
                    description: message,
                });
            }
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
            Selecciona tu usuario e introduce tu contraseña.
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
                            {users && users.filter(u => u && u.username && u.username !== 'admin').map(user => (
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
              <Button type="submit" className="w-full !mt-6" disabled={isPending || usersLoading}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
