'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { Audit } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns';
import { Eye, Loader2, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function getVisitTypeBadgeVariant(visitType?: Audit['visitType']) {
    switch (visitType) {
        case 'PRIMERA VEZ':
            return 'secondary';
        case 'CIERRE DE CASO':
            return 'default';
        case 'Seguimiento':
        default:
            return 'outline';
    }
}

function AuditTableRow({ audit, onDelete, isDeleting }: { audit: Audit, onDelete?: (id: string) => void, isDeleting?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [formattedFollowUpDate, setFormattedFollowUpDate] = useState('');

  useEffect(() => {
    // Date formatting now happens on the client after hydration to prevent timezone mismatch
    const date = new Date(audit.followUpDate);
    if (isValid(date)) {
        setFormattedFollowUpDate(format(date, 'PP'));
    } else {
        setFormattedFollowUpDate('Fecha no válida');
    }
  }, [audit.followUpDate]);
  
  const handleConfirmDelete = () => {
    if (password !== '123456') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Contraseña incorrecta.',
      });
      setPassword('');
      return;
    }

    if (onDelete) {
      onDelete(audit.id);
    }
    setPassword('');
  };

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('');
    }
  };

  return (
      <TableRow className="hover:bg-muted/50">
        <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.id}</TableCell>
        <TableCell className="cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.patientName || 'N/A'}</TableCell>
        <TableCell className="cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.auditorName || 'N/A'}</TableCell>
        <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.event || 'N/A'}</TableCell>
        <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>
            {formattedFollowUpDate ? formattedFollowUpDate : <span className="text-transparent">Cargando...</span>}
        </TableCell>
        <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>
          <Badge variant={getVisitTypeBadgeVariant(audit.visitType)} className="capitalize">
            {audit.visitType?.toLowerCase().replace('_', ' ') || 'N/A'}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" aria-label="Ver Detalles" onClick={() => router.push(`/logs/${audit.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          {onDelete && (
            <AlertDialog onOpenChange={onOpenChange}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Eliminar Auditoría">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Para confirmar la eliminación, por favor introduce la contraseña.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor={`delete-password-${audit.id}`}>Contraseña</Label>
                    <Input
                        id={`delete-password-${audit.id}`}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Introduce la contraseña"
                    />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                     {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </TableCell>
      </TableRow>
  );
}


export function AuditLogTable({ audits, onDelete, isDeleting }: { audits: Audit[], onDelete?: (id: string) => void, isDeleting?: boolean }) {
  const router = useRouter();

  if (audits.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold text-foreground">No se encontraron registros de auditoría.</h3>
        <p className="mb-4 mt-2">Comience creando una nueva entrada de auditoría.</p>
        <Button onClick={() => router.push('/dashboard')}>
          Crear Primera Auditoría
        </Button>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">ID</TableHead>
          <TableHead>Paciente</TableHead>
          <TableHead>Auditor</TableHead>
          <TableHead className="hidden md:table-cell">Evento</TableHead>
          <TableHead className="hidden sm:table-cell">Fecha de Seguimiento</TableHead>
          <TableHead className="hidden sm:table-cell">Tipo de Visita</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {audits.map((audit) => (
            <AuditTableRow 
                key={audit.id}
                audit={audit} 
                onDelete={onDelete} 
                isDeleting={isDeleting}
            />
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
