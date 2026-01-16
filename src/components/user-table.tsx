'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { User } from '@/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Edit } from 'lucide-react';

export function UserTable({ users, onEdit }: { users: Omit<User, 'password'>[], onEdit: (user: Omit<User, 'password'>) => void }) {
  if (users.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold text-foreground">No se encontraron usuarios.</h3>
        <p className="mb-4 mt-2">No hay usuarios registrados en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Nombre de Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.username} className="hover:bg-muted/50">
              <TableCell className="font-medium">{user.fullName}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{user.cargo}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar Usuario</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
