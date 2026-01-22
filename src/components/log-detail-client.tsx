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
import type { Audit, UserProfile } from '@/lib/types';
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
import { getImageAsBase64Action } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { generateAuditPdf } from '@/lib/generate-audit-pdf';
import { format, isValid } from 'date-fns';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  // A value is considered missing if it's null, undefined, or an empty string.
  // We explicitly allow 0 as a valid value for fields like age.
  const isValueMissing = value === null || value === undefined || value === '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3">
      <div className="font-medium text-muted-foreground">{label}</div>
      <div className="md:col-span-2 text-foreground">
        {isValueMissing ? (
          <span className="text-sm font-medium text-destructive">No se proporcionó información</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

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

function formatDateSafe(dateString: string | undefined, formatString: string): string | undefined {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    if (!isValid(date)) return 'Fecha no válida';
    return format(date, formatString);
}


export default function LogDetailClient({ audit }: { audit: Audit }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { profile: currentUserProfile, isUserLoading: isProfileLoading } = useUser();
  const [password, setPassword] = React.useState('');
  
  const handleDelete = () => {
    if(password !== '123456'){
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Contraseña incorrecta.',
      });
      setPassword('');
      return;
    }

    setIsDeleting(true);
    
    deleteDocumentNonBlocking(doc(firestore, 'audits', audit.id));
    
    toast({
      title: 'Auditoría Eliminada',
      description: 'El registro de auditoría ha sido eliminado exitosamente.',
    });

    router.push('/logs');
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const backgroundImage = await getImageAsBase64Action('/imagenes/IMAGENEN UNIFICADA.jpg');
      
      const auditorProfile = await getDoc(doc(firestore, 'users', audit.auditorId));
      const auditorData = auditorProfile.exists() ? auditorProfile.data() as UserProfile : null;
      
      await generateAuditPdf(audit, backgroundImage, auditorData);
      
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
  };

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('');
    }
  };
  
  const formattedCreatedAt = formatDateSafe(audit.createdAt, 'PPPp');
  const showSpecialEventFields = audit.event === 'Intento de Suicidio' || audit.event === 'Consumo de Sustancia Psicoactivas';
  const canDelete = !isProfileLoading && currentUserProfile?.role === 'admin';

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
          {isProfileLoading ? <div/> : canDelete && (
            <AlertDialog onOpenChange={onOpenChange}>
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
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de auditoría. Para confirmar, introduce la contraseña.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="delete-password-detail">Contraseña</Label>
                  <Input
                      id="delete-password-detail"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Introduce la contraseña"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Eliminando...' : 'Continuar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
          <div className="divide-y divide-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="divide-y divide-border">
                <DetailItem label="Auditor" value={audit.auditorName} />
                <DetailItem label="Paciente" value={audit.patientName} />
                <DetailItem label="Tipo de Documento" value={audit.documentType} />
                <DetailItem label="Número de Documento" value={audit.documentNumber} />
                 <DetailItem label="Fecha de Creación" value={formatDateSafe(audit.createdAt, 'PPP')} />
                <DetailItem label="Tipo de Visita" value={<Badge variant={getVisitTypeBadgeVariant(audit.visitType)} className="capitalize">{audit.visitType?.toLowerCase().replace('_', ' ') || 'N/A'}</Badge>} />
              </div>
               <div className="divide-y divide-border">
                <DetailItem label="Evento" value={audit.event} />
                <DetailItem label="Detalles del Evento" value={audit.eventDetails} />
                {audit.event === 'Violencia de Género' && (
                    <>
                        <DetailItem label="Tipo de Violencia" value={audit.genderViolenceType} />
                        <DetailItem label="Detalles Violencia" value={audit.genderViolenceTypeDetails} />
                    </>
                )}
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
                                <DetailItem label="Fecha de Nacimiento" value={formatDateSafe(audit.birthDate, 'PPP')} />
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
              <DetailItem label="Conducta a Seguir" value={<p className="whitespace-pre-wrap">{audit.nextSteps}</p>} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
