
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
import { useTransition } from 'react';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { loginSchema } from '@/lib/schema';
import { useAuth, useUser, FirebaseClientProvider } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const DUMMY_DOMAIN = 'dusakawi.audit.app';

function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (isUserLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }
  
  if(user) {
    router.push('/dashboard');
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  function onSubmit(values: z.infer<typeof loginSchema>) {
    startTransition(async () => {
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({ title: 'Inicio de Sesión Exitoso', description: 'Bienvenido de nuevo.' });
            router.push('/dashboard');
        } catch (error: any) {
            let message = "Ocurrió un error al iniciar sesión.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'El correo o la contraseña son incorrectos.';
            }
            toast({
                variant: 'destructive',
                title: 'Error de Inicio de Sesión',
                description: message,
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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <KeyRound />
            Iniciar Sesión
          </CardTitle>
          <CardDescription>
            Introduce tu correo y contraseña para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@dusakawi.audit.app" {...field} />
                    </FormControl>
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
              <Button type="submit" className="w-full" disabled={isPending}>
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
