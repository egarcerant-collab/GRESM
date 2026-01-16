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
import { useTransition, useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createUserAction } from '@/app/actions';
import { userSchema } from '@/lib/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function UserForm({ onFinished }: { onFinished: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [signatureFileName, setSignatureFileName] = useState('');

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      fullName: '',
      password: '',
      cargo: '',
      role: 'user',
      signature: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSignatureFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('signature', reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setSignatureFileName('');
        form.setValue('signature', undefined);
    }
  };

  function onSubmit(values: z.infer<typeof userSchema>) {
    startTransition(async () => {
      const result = await createUserAction(values);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error al crear usuario',
          description: result.error,
        });
      } else {
        toast({
          title: 'Usuario Creado',
          description: 'El nuevo usuario ha sido registrado exitosamente.',
        });
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
                  <Input placeholder="ej. nuevousuario" {...field} />
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
                <div className="relative">
                    <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            {signatureFileName && <p className="text-sm text-muted-foreground mt-2">Archivo: {signatureFileName}</p>}
            <FormMessage />
        </FormItem>


        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Usuario
          </Button>
        </div>
      </form>
    </Form>
  );
}
