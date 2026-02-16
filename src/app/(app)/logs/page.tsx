'use client';

import { useState, useEffect, useMemo } from 'react';
import { DownloadAuditsButton } from '@/components/download-audits-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePlus, Loader2, Download, AlertTriangle } from 'lucide-react';
import type { Audit, UserProfile } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateAuditPdf } from '@/lib/generate-audit-pdf';
import { getImageAsBase64Action } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';
import { useUser } from '@/firebase';
import { AuditLogTable } from '@/components/audit-log-table';
import { isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import mockUsersData from '@/lib/data/users.json';
import { getAudits, deleteAudit } from '@/lib/audit-data-manager';


// We need to import JSZip like this for it to work with Next.js
const JSZip = require('jszip');

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const months = [
  { value: 'all', label: 'Todos los Meses' },
  { value: '0', label: 'Enero' },
  { value: '1', label: 'Febrero' },
  { value: '2', label: 'Marzo' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Mayo' },
  { value: '5', label: 'Junio' },
  { value: '6', label: 'Julio' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Septiembre' },
  { value: '9', label: 'Octubre' },
  { value: '10', label: 'Noviembre' },
  { value: '11', 'label': 'Diciembre' },
];

export default function LogsPage() {
  const { profile: currentUserProfile, isUserLoading: isProfileLoading } = useUser();
  
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    // Set year on client to avoid hydration mismatch and load data
    setIsClient(true);
    setSelectedYear(new Date().getFullYear().toString());

    setLoading(true);
    try {
        const localAudits = getAudits();
        setAudits(localAudits);
        setError(null);
    } catch (e: any) {
        console.error("Failed to load audits from localStorage", e);
        setError(e);
        setAudits([]);
    } finally {
        setLoading(false);
    }
  }, []);

  const handleDeleteAudit = (id: string) => {
    try {
      deleteAudit(id);
      const updatedAudits = getAudits();
      setAudits(updatedAudits);
      toast({
        title: "Auditoría Eliminada",
        description: "El registro ha sido eliminado.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: e.message || "No se pudo eliminar la auditoría.",
      });
    }
  };

  const filteredAudits = useMemo(() => {
    if (!audits) return [];
    return audits.filter((audit) => {
      const auditDate = new Date(audit.createdAt);
      if (!isValid(auditDate)) return false;
      const yearMatch = auditDate.getFullYear().toString() === selectedYear;
      const monthMatch =
        selectedMonth === 'all' ||
        auditDate.getMonth().toString() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [audits, selectedYear, selectedMonth]);
  
  const handleMassPdfDownload = async () => {
    if (filteredAudits.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay informes para descargar',
        description: 'No hay auditorías que coincidan con los filtros seleccionados.',
      });
      return;
    }
  
    setIsDownloading(true);
    toast({
      title: 'Generando PDFs...',
      description: `Preparando ${filteredAudits.length} informes. Esto puede tardar un momento.`,
    });
  
    try {
      const zip = new JSZip();
      const backgroundImage = await getImageAsBase64Action('/imagenes/IMAGENEN UNIFICADA.jpg');
      
      for (const audit of filteredAudits) {
        const auditorData = mockUsersData.find(u => u.uid === audit.auditorId) || null;

        const { jsPDF } = await import('jspdf');
        const docPDF = await generateAuditPdf(audit, backgroundImage, auditorData as UserProfile | null, new jsPDF({
          orientation: "p",
          unit: "pt",
          format: "a4"
        }));
        const pdfBlob = docPDF.output('blob');
        const fileName = `Informe_Auditoria_${audit.id}_${(audit.patientName || 'SinNombre').replace(/ /g, '_')}.pdf`;
        zip.file(fileName, pdfBlob);
      }
  
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `Informes_Auditoria_${selectedYear}${selectedMonth !== 'all' ? `-${parseInt(selectedMonth)+1}`: ''}.zip`;
      
      saveAs(zipBlob, zipFileName);
  
      toast({
        title: 'Descarga Completa',
        description: `Se ha descargado un archivo ZIP con ${filteredAudits.length} informes.`,
      });
    } catch (error) {
      console.error('Error generando los PDFs en masa:', error);
      toast({
        variant: 'destructive',
        title: 'Error al generar PDFs',
        description: 'No se pudieron generar los informes en masa.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const canDelete = !isProfileLoading && currentUserProfile?.role === 'admin';

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-2xl">
            Registro de Auditoría
          </CardTitle>
          <CardDescription>
            Una lista de todas las entradas de auditoría registradas. Haga clic
            en 'Ver' para ver los detalles.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button asChild className="w-full md:w-auto">
            <Link href="/dashboard">
              <FilePlus className="mr-2 h-4 w-4" />
              Nueva Auditoría
            </Link>
          </Button>
          <DownloadAuditsButton audits={filteredAudits} />
           <Button
            variant="outline"
            onClick={handleMassPdfDownload}
            disabled={isDownloading || filteredAudits.length === 0}
            className="w-full md:w-auto"
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Descargar PDFs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg min-h-[72px]">
            <p className="text-sm font-medium">Filtrar por fecha de creación:</p>
            {isClient ? (
              <>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                    {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                        {year}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                    {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                        {month.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[180px]" />
              </>
            )}
        </div>

        {loading || isProfileLoading ? (
            <div className='flex justify-center items-center h-64'>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : error ? (
            <div className="text-center text-destructive py-16 border-2 border-dashed rounded-lg border-destructive/50">
              <AlertTriangle className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-xl font-semibold">Error al Cargar los Registros</h3>
              <p className="mt-2 text-sm max-w-md mx-auto">{error.message}</p>
            </div>
        ) : (
          <AuditLogTable audits={filteredAudits} onDelete={canDelete ? handleDeleteAudit : undefined} />
        )}
      </CardContent>
    </Card>
  );
}
