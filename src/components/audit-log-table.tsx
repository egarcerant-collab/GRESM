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
import { format } from 'date-fns';
import { Eye, Trash2 } from 'lucide-react';
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

function getVisitTypeBadgeVariant(visitType: Audit['visitType']) {
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


export function AuditLogTable({ audits, onDelete }: { audits: Audit[], onDelete?: (id: string) => void }) {
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
          <TableHead className="hidden md:table-cell">Evento</TableHead>
          <TableHead className="hidden sm:table-cell">Fecha de Seguimiento</TableHead>
          <TableHead className="hidden sm:table-cell">Tipo de Visita</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {audits.map((audit) => (
          <TableRow key={audit.id} className="hover:bg-muted/50">
            <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.id}</TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.patientName}</TableCell>
            <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.event}</TableCell>
            <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{format(new Date(audit.followUpDate), 'PP')}</TableCell>
            <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>
              <Badge variant={getVisitTypeBadgeVariant(audit.visitType)} className="capitalize">
                {audit.visitType.toLowerCase().replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" aria-label="Ver Detalles" onClick={() => router.push(`/logs/${audit.id}`)}>
                <Eye className="h-4 w-4" />
              </Button>
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Eliminar Auditoría">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de auditoría.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(audit.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
