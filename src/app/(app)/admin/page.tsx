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
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchUsers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administración de Usuarios</CardTitle>
        <CardDescription>
          Gestión de usuarios y configuración del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <UserTable users={users} />
        )}
      </CardContent>
    </Card>
  );
}
