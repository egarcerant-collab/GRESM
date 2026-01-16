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
import { FilePlus, KeyRound, User as UserIcon, LogOut } from 'lucide-react';
import { getUsersAction, findUserByUsernameAction } from '@/app/actions';
import type { User } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password' | 'signature'> | null>(null);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');
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

    const storedUserJson = localStorage.getItem('loggedInUser');
    if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        setCurrentUser(storedUser);
        setSelectedUsername(storedUser.username);
    }
  }, [toast]);

  const handleAuth = async () => {
    if (!selectedUsername) {
      toast({
        variant: 'destructive',
        title: 'Selección Requerida',
        description: 'Por favor, seleccione un usuario.',
      });
      return;
    }

    const { user: fullUser, error } = await findUserByUsernameAction(selectedUsername);
    if (error || !fullUser || !fullUser.password) {
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: error || 'No se pudo verificar el usuario.',
      });
      return;
    }

    if (password === fullUser.password) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _p, ...auditor } = fullUser;
      setCurrentUser(auditor);
      localStorage.setItem('loggedInUser', JSON.stringify(auditor));
      window.dispatchEvent(new CustomEvent('auth-change'));
    } else {
      toast({
        variant: 'destructive',
        title: 'Contraseña Incorrecta',
        description: 'La contraseña que ingresaste no es correcta.',
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedUsername('');
    setPassword('');
    localStorage.removeItem('loggedInUser');
    window.dispatchEvent(new CustomEvent('auth-change'));
  };


  if (currentUser) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <FilePlus />
                Nueva Auditoría
              </CardTitle>
              <CardDescription>
                Sesión iniciada como <strong>{currentUser.fullName}</strong>. Rellene el siguiente formulario para registrar una nueva entrada de auditoría.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AuditForm auditor={currentUser} />
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
              <Select value={selectedUsername} onValueChange={setSelectedUsername}>
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
