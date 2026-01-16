'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUsersAction, deleteUserAction } from '@/app/actions';
import type { User } from '@/lib/types';
import { Loader2, UserPlus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserForm } from '@/components/admin/user-form';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false); // for edit dialog
  const [editingUser, setEditingUser] = useState<Omit<User, 'password'> | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { users: fetchedUsers, error } = await getUsersAction();
    if (error) {
      console.error('Failed to fetch users:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar usuarios',
        description: error,
      });
    } else {
      setUsers(fetchedUsers);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleEditClick = (user: Omit<User, 'password'>) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleDeleteUser = async (username: string) => {
    if (username === 'eg') {
        toast({
            variant: 'destructive',
            title: 'Acción no permitida',
            description: 'No se puede eliminar al mega usuario.',
        });
        return;
    }

    const result = await deleteUserAction(username);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: result.error,
      });
    } else {
      toast({
        title: 'Usuario Eliminado',
        description: 'El usuario ha sido eliminado exitosamente.',
      });
      fetchUsers();
    }
  };

  const onFormFinished = () => {
      setIsFormOpen(false);
      setEditingUser(null);
      fetchUsers();
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline">Panel de Administración</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <UserPlus />
                Crear Nuevo Usuario
            </CardTitle>
            <CardDescription>
              Crea un nuevo usuario para la aplicación con su rol, cargo y firma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm onFinished={fetchUsers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios Existentes</CardTitle>
            <CardDescription>Gestiona los usuarios registrados en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
              <ul className="space-y-4">
                {users.map((user) => (
                  <li
                    key={user.username}
                    className="flex justify-between items-start p-4 border rounded-lg gap-4 flex-wrap hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                        <div className='flex items-center gap-2'>
                            <p className="font-semibold text-lg">{user.fullName || user.username}</p>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                            </Badge>
                        </div>
                      
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.cargo && <p className="text-sm text-foreground mt-1">{user.cargo}</p>}
                      {user.signature && (
                        <div className="mt-2">
                             <p className="text-xs font-medium text-muted-foreground mb-1">Firma:</p>
                             <Image src={user.signature} alt={`Firma de ${user.username}`} width={120} height={60} className="bg-white border rounded object-contain p-1" />
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-1'>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar Usuario</span>
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className='text-destructive hover:text-destructive' disabled={user.username === 'eg'}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Eliminar Usuario</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.username)}>
                                    Eliminar
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {users.length === 0 && !loading && (
                 <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold text-foreground">No se encontraron usuarios.</h3>
                    <p className="mt-2">Comienza creando el primer usuario en el formulario de arriba.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                <DialogTitle>Editar Usuario: {editingUser?.username}</DialogTitle>
                 <DialogDescription>
                  Actualice los detalles del usuario a continuación. Deje la contraseña en blanco para no cambiarla.
                </DialogDescription>
                </DialogHeader>
                <UserForm onFinished={onFormFinished} initialData={editingUser} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
