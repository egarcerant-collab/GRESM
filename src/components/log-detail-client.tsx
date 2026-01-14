'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Audit } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, FileDown, Loader2 } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { deleteAuditAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { generateAuditPdf } from '@/lib/generate-audit-pdf';
import { format } from 'date-fns';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="md:col-span-2 text-foreground">{value}</dd>
    </div>
  );
}

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

export default function LogDetailClient({ audit, formattedCreatedAt }: { audit: Audit, formattedCreatedAt: string }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (audit) {
      setIsDeleting(true);
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
        setIsDeleting(false);
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (audit) {
      setIsDownloading(true);
      try {
        await generateAuditPdf(audit);
        toast({
          title: 'PDF Generado',
          description: 'El informe de auditoría se ha descargado.',
        });
      } catch (error) {
        console.error('Error generando el PDF:', error);
        toast({
          variant: 'destructive',
          title: 'Error al generar PDF',
          description: 'No se pudo generar el informe en PDF.',
        });
      } finally {
        setIsDownloading(false);
      }
    }
  };

  // Dates are strings after serialization, convert them back
  const followUpDate = new Date(audit.followUpDate);
  const birthDate = audit.birthDate ? new Date(audit.birthDate) : null;
  
  const showSpecialEventFields = audit.event === 'Intento de Suicidio' || audit.event === 'Consumo de Sustancia Psicoactivas';

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
        
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Descargar PDF
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
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
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Eliminando...' : 'Continuar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Auditoría ID: {audit.id}</CardTitle>
          <CardDescription>
            Registrado el {formattedCreatedAt}
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
                <DetailItem label="Tipo de Visita" value={<Badge variant={getVisitTypeBadgeVariant(audit.visitType)} className="capitalize">{audit.visitType.toLowerCase().replace('_', ' ')}</Badge>} />
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

            {showSpecialEventFields && (
                <>
                    <div className="pt-4">
                        <h3 className="text-md font-semibold mt-4 mb-2 text-foreground">Información Adicional de Evento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <div className="divide-y divide-border">
                                <DetailItem label="Fecha de Nacimiento" value={birthDate ? format(birthDate, 'PPP') : null} />
                                <DetailItem label="Edad" value={audit.age} />
                                <DetailItem label="Sexo" value={audit.sex} />
                                <DetailItem label="Estado de Afiliación" value={audit.affiliationStatus} />
                                <DetailItem label="Área" value={audit.area} />
                                <DetailItem label="Asentamiento" value={audit.settlement} />
                            </div>
                            <div className="divide-y divide-border">
                                <DetailItem label="Nacionalidad" value={audit.nationality} />
                                <DetailItem label="IPS Primaria" value={audit.primaryHealthProvider} />
                                <DetailItem label="Régimen" value={audit.regime} />
                                <DetailItem label="UPGD o Prestador" value={audit.upgdProvider} />
                                <DetailItem label="Tipo de Intervención" value={audit.followUpInterventionType} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="pt-4">
              <DetailItem label="Notas de Seguimiento" value={<p className="whitespace-pre-wrap">{audit.followUpNotes}</p>} />
            </div>
            <div className="pt-4">
              <DetailItem label="Pasos a Seguir" value={<p className="whitespace-pre-wrap">{audit.nextSteps}</p>} />
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
