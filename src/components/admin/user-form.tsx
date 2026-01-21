
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { userSchema } from '@/lib/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';


const DUMMY_DOMAIN = 'dusakawi.audit.app';

export function UserForm({ onFinished, initialData }: { onFinished: () => void, initialData?: UserProfile | null }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();

  const isEditMode = !!initialData;
  
  const [signaturePreview, setSignaturePreview] = useState(initialData?.signature || '');

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: initialData?.username || '',
      fullName: initialData?.fullName || '',
      password: '', // Always clear password for security
      cargo: initialData?.cargo || '',
      role: initialData?.role || 'user',
      signature: initialData?.signature || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        username: initialData.username,
        fullName: initialData.fullName,
        password: '',
        cargo: initialData.cargo,
        role: initialData.role,
        signature: initialData.signature || '',
      });
      setSignaturePreview(initialData.signature || '');
    } else {
        form.reset({
            username: '',
            fullName: '',
            password: '',
            cargo: '',
            role: 'user',
            signature: '',
        });
        setSignaturePreview('');
    }
  }, [initialData, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const currentInput = event.currentTarget;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue('signature', result);
        setSignaturePreview(result);
      };
      reader.readAsDataURL(file);
    } else {
        form.setValue('signature', '');
        setSignaturePreview('');
        if (currentInput) {
            currentInput.value = "";
        }
    }
  };

  async function handleCreateUser(values: z.infer<typeof userSchema>) {
    if (!values.password) {
        toast({ variant: 'destructive', title: 'Error', description: 'La contraseña es requerida para crear un usuario.' });
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, `${values.username}@${DUMMY_DOMAIN}`, values.password);
        const user = userCredential.user;

        const userProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            username: values.username,
            fullName: values.fullName,
            role: values.role,
            cargo: values.cargo,
            signature: values.signature
        };

        setDocumentNonBlocking(doc(firestore, "users", user.uid), userProfile, {});
        toast({ title: 'Usuario Creado', description: 'El usuario ha sido registrado exitosamente.'});
        form.reset();
        setSignaturePreview('');
        onFinished();

    } catch (error: any) {
        const errorCode = error.code;
        let message = error.message;
        if (errorCode === 'auth/email-already-in-use') {
            message = 'Este nombre de usuario ya está en uso.';
        } else if (errorCode === 'auth/weak-password') {
            message = 'La contraseña es demasiado débil.';
        }
        toast({ variant: 'destructive', title: 'Error al crear usuario', description: message });
    }
  }

  function handleUpdateUser(values: z.infer<typeof userSchema>) {
      if (!initialData) return;
      
      const userProfileUpdate: Partial<UserProfile> = {
        fullName: values.fullName,
        role: values.role,
        cargo: values.cargo,
        signature: values.signature
      };

      setDocumentNonBlocking(doc(firestore, "users", initialData.uid), userProfileUpdate, { merge: true });

      if (values.password && auth.currentUser) {
          // This is a sensitive operation and might require recent sign-in.
          // For this app, we assume the admin user is recently signed in.
          // A more robust implementation would reauthenticate the admin.
          // We can't update other users' passwords from the client SDK directly.
          // This is a limitation. We will skip password updates on the edit form for now.
          console.warn("Client-side password update for other users is not supported. Skipping.");
      }

      toast({ title: 'Usuario Actualizado', description: 'El usuario ha sido actualizado exitosamente.' });
      onFinished();
  }

  function onSubmit(values: z.infer<typeof userSchema>) {
    startTransition(async () => {
      if (isEditMode) {
        handleUpdateUser(values);
      } else {
        await handleCreateUser(values);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="ej. nuevousuario" {...field} disabled={isEditMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormDescription>
                    {isEditMode ? "La actualización de contraseña no está disponible en este formulario." : "La contraseña debe tener al menos 6 caracteres."}
                </FormDescription>
                <div className="relative">
                    <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} placeholder={isEditMode ? '••••••••' : 'Contraseña requerida'} {...field} disabled={isEditMode} />
                    </FormControl>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="cargo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Gerente de Proyectos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormItem>
            <FormLabel>Firma (Imagen)</FormLabel>
            <FormControl>
                <Input type="file" onChange={handleFileChange} accept="image/png, image/jpeg" />
            </FormControl>
            {signaturePreview && (
              <div className="mt-2 p-2 border rounded-md bg-muted">
                  <p className="text-sm font-medium mb-1">Previsualización:</p>
                  <Image src={signaturePreview} alt="Previsualización de la firma" width={150} height={75} className="bg-white object-contain rounded-md" />
              </div>
            )}
            <FormMessage />
        </FormItem>


        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
