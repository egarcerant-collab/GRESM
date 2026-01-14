
'use client';

import { notFound, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { AiAnalysis } from '@/components/ai-analysis';
import type { Audit } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
} from "@/components/ui/alert-dialog";
import { deleteAuditAction, getAuditByIdAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import React from 'react';


function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="md:col-span-2 text-foreground">{value}</dd>
    </div>
  );
}

export default function LogDetailPage({ params }: { params: { id: string } }) {
  const [audit, setAudit] = React.useState<Audit | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id;

  React.useEffect(() => {
    getAuditByIdAction(id).then(({ audit: data }) => {
      if (data) {
        setAudit(data);
      } else {
        notFound();
      }
      setIsLoading(false);
    });
  }, [id]);


  const handleDelete = async () => {
    if (audit) {
      const result = await deleteAuditAction(audit.id);
      if (result.success) {
        toast({
          title: 'Auditoría Eliminada',
          description: 'El registro de auditoría ha sido eliminado exitosamente.',
        });
        router.push('/logs');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al Eliminar Auditoría',
          description: result.error,
        });
      }
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!audit) {
    return notFound();
  }
  
  // Dates are strings after serialization, convert them back
  const followUpDate = new Date(audit.followUpDate);
  const createdAt = new Date(audit.createdAt);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/logs">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver a los registros</span>
            </Link>
          </Button>
          <h1 className="font-headline text-2xl text-foreground">Detalles de Auditoría</h1>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
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
              <AlertDialogAction onClick={handleDelete}>
                Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Auditoría ID: {audit.id}</CardTitle>
          <CardDescription>
            Registrado el {format(createdAt, 'PPPp')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="divide-y divide-border">
                <DetailItem label="Auditor" value={audit.auditorName} />
                <DetailItem label="Paciente" value={audit.patientName} />
                <DetailItem label="Tipo de Documento" value={audit.documentType} />
                <DetailItem label="Número de Documento" value={audit.documentNumber} />
                 <DetailItem label="Fecha de Seguimiento" value={format(followUpDate, 'PPP')} />
                <DetailItem label="Tipo de Visita" value={<Badge variant={audit.visitType === 'PRIMERA VEZ' ? 'secondary' : 'outline'} className="capitalize">{audit.visitType.toLowerCase().replace('_', ' ')}</Badge>} />
              </div>
               <div className="divide-y divide-border">
                <DetailItem label="Evento" value={audit.event} />
                <DetailItem label="Detalles del Evento" value={audit.eventDetails} />
                <DetailItem label="Departamento" value={audit.department} />
                <DetailItem label="Municipio" value={audit.municipality} />
                <DetailItem label="Etnia" value={audit.ethnicity} />
                <DetailItem label="Dirección" value={audit.address} />
                <DetailItem label="Número de Teléfono" value={audit.phoneNumber} />
              </div>
            </div>
            <div className="pt-4">
              <DetailItem label="Notas de Seguimiento" value={<p className="whitespace-pre-wrap">{audit.followUpNotes}</p>} />
            </div>
            <div className="pt-4">
              <DetailItem label="Pasos a Seguir" value={<p className="whitespace-pre-wrap">{audit.nextSteps}</p>} />
            </div>
          </dl>
        </CardContent>
      </Card>
      <AiAnalysis audit={audit as Audit} />
    </div>
  );
}
