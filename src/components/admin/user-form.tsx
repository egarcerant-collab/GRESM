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
import { createUserAction, updateUserAction } from '@/app/actions';
import { userSchema } from '@/lib/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { User } from '@/lib/types';
import Image from 'next/image';

export function UserForm({ onFinished, initialData }: { onFinished: () => void, initialData?: Omit<User, 'password'> | null }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  const isEditMode = !!initialData;
  
  const [signaturePreview, setSignaturePreview] = useState(initialData?.signature || '');

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: initialData?.username || '',
      fullName: initialData?.fullName || '',
      password: '',
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
        signature: initialData.signature,
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
        form.setValue('signature', undefined);
        setSignaturePreview('');
        if (currentInput) {
            currentInput.value = "";
        }
    }
  };

  function onSubmit(values: z.infer<typeof userSchema>) {
    startTransition(async () => {
      const action = isEditMode
        ? () => updateUserAction(initialData!.username, values)
        : () => createUserAction(values);
      
      const result = await action();
      
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: `Error al ${isEditMode ? 'actualizar' : 'crear'} usuario`,
          description: result.error,
        });
      } else {
        toast({
          title: `Usuario ${isEditMode ? 'Actualizado' : 'Creado'}`,
          description: `El usuario ha sido ${isEditMode ? 'actualizado' : 'registrado'} exitosamente.`,
        });
        if (!isEditMode) {
            form.reset();
            setSignaturePreview('');
        }
        onFinished();
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
                {isEditMode && <FormDescription>Dejar en blanco para no cambiar la contraseña.</FormDescription>}
                <div className="relative">
                    <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} placeholder={isEditMode ? '•••••••• (opcional)' : 'Contraseña requerida'} {...field} />
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
