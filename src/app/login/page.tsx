
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
import { useToast } from '@/hooks/use-toast';

function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const users = mockUsers as UserProfile[];

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    startTransition(async () => {
      try {
        // Iniciamos sesión de forma real en Firebase Auth
        const userCredential = await signInAnonymously(auth);
        
        if (userCredential.user) {
          toast({
            title: "Acceso Exitoso",
            description: "Bienvenido al sistema de auditoría.",
          });
          // Redirección inmediata tras el éxito
          router.replace('/dashboard');
        }
      } catch (e: any) {
        console.error('Error al iniciar sesión:', e);
        toast({
          variant: "destructive",
          title: "Error de Acceso",
          description: "No se pudo conectar con el servidor de seguridad. Intente de nuevo.",
        });
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center gap-4 mb-8">
            <ShieldCheck className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold font-headline text-primary">Audit Logger</h1>
        </div>
      <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="text-primary" />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <Button type="submit" className="w-full !mt-6 text-lg h-12" disabled={isPending}>
                 {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Ingresar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground">Dusakawi EPSI - Gestión de Riesgo en Salud Mental</p>
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
