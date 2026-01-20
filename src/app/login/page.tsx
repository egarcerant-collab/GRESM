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
import React, { useTransition } from 'react';
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


function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersCollection);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  React.useEffect(() => {
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
        try {
            await signInWithEmailAndPassword(auth, email, values.password);
            toast({ title: 'Inicio de Sesión Exitoso', description: 'Bienvenido de nuevo.' });
        } catch (error: any) {
            // Only try to create a user if there are no users in the system yet.
            if ((!users || users.length === 0) && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
                    const newUser = userCredential.user;

                    const username = values.username;
                    const userProfile: UserProfile = {
                        uid: newUser.uid,
                        email: newUser.email!,
                        username: username,
                        fullName: username,
                        role: 'admin',
                        cargo: 'Administrador',
                    };

                    setDocumentNonBlocking(doc(firestore, "users", newUser.uid), userProfile, {});
                    
                    toast({ title: 'Cuenta Creada', description: '¡Bienvenido! Se ha creado tu cuenta con rol de administrador.' });

                } catch (creationError: any) {
                    let message = "Ocurrió un error al registrar la cuenta.";
                    if (creationError.code === 'auth/weak-password') {
                        message = 'La contraseña es muy débil (mínimo 6 caracteres).';
                    }
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: message,
                    });
                }
            } else {
                 let message = "Credenciales incorrectas.";
                 if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    message = 'La contraseña es incorrecta para el usuario seleccionado.';
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
            {(!users || users.length === 0) && !usersLoading ? 
                "Introduce tu usuario y contraseña. Se creará una cuenta de administrador para ti." : 
                "Selecciona tu usuario e introduce tu contraseña."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    {(users && users.length > 0) ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Seleccione un usuario" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {users.map(user => (
                                    <SelectItem key={user.uid} value={user.username}>{user.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <FormControl>
                          <Input placeholder="ej. juanperez" {...field} />
                        </FormControl>
                    )}
                     {usersLoading && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending || usersLoading}>
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
