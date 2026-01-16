'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUsersAction } from '@/app/actions';
import type { User } from '@/lib/types';
import { UserTable } from '@/components/user-table';
import { Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserForm } from '@/components/admin/user-form';

export default function AdminPage() {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Omit<User, 'password'> | null>(null);

  async function fetchUsers() {
    setLoading(true);
    const { users: fetchedUsers, error } = await getUsersAction();
    if (error) {
      console.error('Failed to fetch users:', error);
    } else {
      setUsers(fetchedUsers);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Refetch users when form is closed to see the new/updated user
  useEffect(() => {
      if(!isFormOpen) {
          fetchUsers();
          setEditingUser(null);
      }
  }, [isFormOpen]);

  const handleEditClick = (user: Omit<User, 'password'>) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleCreateClick = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Administración de Usuarios</CardTitle>
            <CardDescription>
              Gestión de usuarios y configuración del sistema.
            </CardDescription>
          </div>
          <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Actualice los detalles del usuario a continuación.' : 'Complete el formulario para agregar un nuevo usuario al sistema.'}
                </DialogDescription>
              </DialogHeader>
              <UserForm onFinished={() => setIsFormOpen(false)} initialData={editingUser} />
            </DialogContent>
          </Dialog>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <UserTable users={users} onEdit={handleEditClick} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
