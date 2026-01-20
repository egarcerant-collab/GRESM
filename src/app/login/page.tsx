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
import { useFirebase, useUser, FirebaseClientProvider, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);

  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersCollection);

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
    const email = `${values.username}@dusakawi.audit.app`;
    startTransition(async () => {
      if (isSignUp) {
        // SIGN UP LOGIC
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
            const newUser = userCredential.user;

            const userProfile: UserProfile = {
                uid: newUser.uid,
                email: newUser.email!,
                username: values.username,
                fullName: values.username,
                role: 'user',
                cargo: 'Auditor',
            };

            // If it's the very first user, make them an admin.
            if (!users || users.length === 0) {
                userProfile.role = 'admin';
                userProfile.cargo = 'Administrador';
            }

            setDocumentNonBlocking(doc(firestore, "users", newUser.uid), userProfile, {});
            
            toast({ title: 'Cuenta Creada', description: '¡Bienvenido! Ahora puedes iniciar sesión.' });
            setIsSignUp(false); // Switch back to login mode
            form.reset();

        } catch (creationError: any) {
            let message = "Ocurrió un error al registrar la cuenta.";
            if (creationError.code === 'auth/email-already-in-use') {
                message = 'Ese nombre de usuario ya existe. Intenta con otro.';
            } else if (creationError.code === 'auth/weak-password') {
                message = 'La contraseña es muy débil (mínimo 6 caracteres).';
            }
            toast({
                variant: 'destructive',
                title: 'Error de Registro',
                description: message,
            });
        }
      } else {
        // SIGN IN LOGIC
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
            {isSignUp ? 'Crear Nueva Cuenta' : 'Acceder al Sistema'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Introduce un nuevo nombre de usuario y contraseña.'
              : 'Selecciona tu usuario e introduce tu contraseña.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                  <Switch id="signup-mode" checked={isSignUp} onCheckedChange={(checked) => { setIsSignUp(checked); form.reset(); }} />
                  <Label htmlFor="signup-mode">Crear nuevo usuario</Label>
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    {isSignUp || !users || users.length === 0 ? (
                        <FormControl>
                          <Input placeholder="ej. juanperez" {...field} />
                        </FormControl>
                    ): (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Seleccione un usuario" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {users && users.filter(u => u && u.username).map(user => (
                                    <SelectItem key={user.uid} value={user.username}>
                                        {user.fullName || user.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                     {usersLoading && !isSignUp && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cargando usuarios...</span>
                        </div>
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
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending || usersLoading}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Crear Cuenta' : 'Ingresar'}
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
