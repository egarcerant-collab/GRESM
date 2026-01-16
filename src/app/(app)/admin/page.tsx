'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Administración</CardTitle>
        <CardDescription>
          Gestión de usuarios y configuración del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>El panel de administración se construirá aquí.</p>
      </CardContent>
    </Card>
  );
}
