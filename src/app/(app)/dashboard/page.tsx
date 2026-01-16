'use client';

import { useState, useEffect } from 'react';
import { AuditForm } from '@/components/audit-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, KeyRound, User as UserIcon } from 'lucide-react';
import { getUsersAction } from '@/app/actions';
import type { User } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      const { users: fetchedUsers, error } = await getUsersAction();
      if (error) {
        console.error('Failed to fetch users:', error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar usuarios',
          description: 'No se pudieron obtener los usuarios.',
        });
      } else {
        setUsers(fetchedUsers);
      }
    }
    fetchUsers();
  }, [toast]);

  const handleAuth = () => {
    if (!selectedUser) {
      toast({
        variant: 'destructive',
        title: 'Selección Requerida',
        description: 'Por favor, seleccione un usuario.',
      });
      return;
    }

    if (password === '123456') {
      setIsAuthenticated(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Contraseña Incorrecta',
        description: 'La contraseña que ingresaste no es correcta.',
      });
      setPassword('');
    }
  };

  const auditor = users.find((u) => u.username === selectedUser);

  if (isAuthenticated && auditor) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <FilePlus />
            Nueva Auditoría
          </CardTitle>
          <CardDescription>
            Sesión iniciada como <strong>{auditor.fullName}</strong>. Rellene el siguiente formulario para registrar una nueva entrada de auditoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditForm auditor={auditor} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <KeyRound />
            Verificación Requerida
          </CardTitle>
          <CardDescription>
            Seleccione su usuario e introduzca la contraseña para crear una nueva auditoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth();
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
               <Label htmlFor="user-select" className='flex items-center gap-2'><UserIcon className='h-4 w-4 text-muted-foreground' />Usuario</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Seleccione un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.username} value={user.username}>
                      {user.fullName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Contraseña</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduce la contraseña"
              />
            </div>
            <Button type="submit" className="w-full">
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
