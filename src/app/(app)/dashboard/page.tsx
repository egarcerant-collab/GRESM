'use client';

import { useState } from 'react';
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
import { FilePlus, KeyRound } from 'lucide-react';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleAuth = () => {
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

  if (isAuthenticated) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <FilePlus />
            Nueva Auditoría
          </CardTitle>
          <CardDescription>
            Rellene el siguiente formulario para registrar una nueva entrada de auditoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditForm />
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
            Para crear una nueva auditoría, por favor introduce la contraseña de acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-password">Contraseña</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduce la contraseña"
                autoFocus
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
