
'use client';

import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getImageAsBase64Action } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { generateAuditPdf } from '@/lib/generate-audit-pdf';
import { format, isValid } from 'date-fns';
import mockUsersData from '@/lib/data/users.json';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  const isValueMissing = value === null || value === undefined || value === '';
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3">
      <div className="font-medium text-muted-foreground">{label}</div>
      <div className="md:col-span-2 text-foreground">
        {isValueMissing ? <span className="text-sm font-medium text-destructive">No se proporcionó</span> : value}
      </div>
    </div>
  );
}

export default function LogDetailClient({ audit: initialAudit }: { audit: Audit }) {
  const [audit, setAudit] = useState<Audit>(initialAudit);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const backgroundImage = await getImageAsBase64Action('imagenes/IMAGEN UNIFICADA.jpg');
      const auditorData = mockUsersData.find(u => u.uid === audit.auditorId) || null;
      await generateAuditPdf(audit, backgroundImage, auditorData as UserProfile | null);
      toast({ title: 'PDF Generado' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al generar PDF' });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isValid(d) ? format(d, 'PPP') : 'Fecha no válida';
  };

  const showSpecialInfo = audit.event === 'Intento de Suicidio' || audit.event === 'Consumo de Sustancia Psicoactivas';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/logs"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-headline text-2xl">Detalles de Auditoría</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading}>
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          Descargar PDF
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Auditoría ID: {audit.id}</CardTitle>
          <CardDescription>Registrado el {formatDate(audit.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
            <DetailItem label="Auditor" value={audit.auditorName} />
            <DetailItem label="Paciente" value={audit.patientName} />
            <DetailItem label="Documento" value={`${audit.documentType} - ${audit.documentNumber}`} />
            <DetailItem label="Evento" value={audit.event} />
            
            {showSpecialInfo && (
              <>
                <DetailItem label="Fecha Nacimiento" value={formatDate(audit.birthDate)} />
                <DetailItem label="Edad" value={audit.age} />
                <DetailItem label="Sexo" value={audit.sex} />
                <DetailItem label="Estado Afiliación" value={audit.affiliationStatus} />
                <DetailItem label="Área" value={audit.area} />
                <DetailItem label="Asentamiento" value={audit.settlement} />
                <DetailItem label="Nacionalidad" value={audit.nationality} />
                <DetailItem label="IPS Atención Primaria" value={audit.primaryHealthProvider} />
                <DetailItem label="Régimen" value={audit.regime} />
                <DetailItem label="Nombre UPGD" value={audit.upgdProvider} />
                <DetailItem label="Tipo Intervención" value={audit.followUpInterventionType} />
              </>
            )}

            <DetailItem label="Seguimiento" value={<p className="whitespace-pre-wrap">{audit.followUpNotes}</p>} />
            <DetailItem label="Conducta" value={<p className="whitespace-pre-wrap">{audit.nextSteps}</p>} />
        </CardContent>
      </Card>
    </div>
  );
}
