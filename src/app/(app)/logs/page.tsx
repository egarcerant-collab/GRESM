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
import { FilePlus, Loader2, Download } from 'lucide-react';
import type { Audit, UserProfile } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateAuditPdf } from '@/lib/generate-audit-pdf';
import { getImageAsBase64Action, getAuditsAction, deleteAuditAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';
import { useUser } from '@/firebase';
import { AuditLogTable } from '@/components/audit-log-table';
import mockUsersData from '@/lib/data/users.json';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const JSZip = require('jszip');

const years = Array.from({ length: 6 }, (_, i) => 2026 - i);
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
  { value: '11', label: 'Diciembre' },
];

export default function LogsPage() {
  const { profile: currentUserProfile } = useUser();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    async function fetchAudits() {
      setLoading(true);
      try {
        const data = await getAuditsAction();
        setAudits(data);
        
        if (data.length > 0) {
          const currentYear = new Date().getFullYear().toString();
          const hasDataForCurrentYear = data.some(a => {
            const date = new Date(a.createdAt);
            return !isNaN(date.getTime()) && date.getFullYear().toString() === currentYear;
          });
          
          if (!hasDataForCurrentYear) {
            // Si no hay datos este año, buscamos el año más reciente en los datos
            const latestYearInDate = data.reduce((latest, audit) => {
              const date = new Date(audit.createdAt);
              const year = isNaN(date.getTime()) ? 0 : date.getFullYear();
              return year > latest ? year : latest;
            }, 0);
            
            if (latestYearInDate !== 0) {
              setSelectedYear(latestYearInDate.toString());
            }
          }
        }
      } catch (error) {
        console.error("Failed to load audits", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAudits();
  }, []);

  const handleDeleteAudit = async (id: string) => {
    const res = await deleteAuditAction(id);
    if (res.success) {
      setAudits(prev => prev.filter(a => a.id !== id));
      toast({ title: "Auditoría Eliminada" });
    } else {
      toast({ variant: 'destructive', title: "Error al eliminar", description: res.error });
    }
  };

  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      const auditDate = new Date(audit.createdAt);
      if (isNaN(auditDate.getTime())) return false;
      const yearMatch = auditDate.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'all' || auditDate.getMonth().toString() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [audits, selectedYear, selectedMonth]);
  
  const handleMassPdfDownload = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const backgroundImage = await getImageAsBase64Action('imagenes/IMAGEN UNIFICADA.jpg');
      
      for (const audit of filteredAudits) {
        const auditorData = mockUsersData.find(u => u.uid === audit.auditorId) || null;
        const { jsPDF } = await import('jspdf');
        const docPDF = await generateAuditPdf(audit, backgroundImage, auditorData as UserProfile | null, new jsPDF({
          orientation: "p",
          unit: "pt",
          format: "a4"
        }));
        const pdfBlob = docPDF.output('blob');
        zip.file(`Informe_${audit.id}.pdf`, pdfBlob);
      }
  
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Informes_${selectedYear}.zip`);
      toast({ title: 'Descarga Completa' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al generar PDFs' });
    } finally {
      setIsDownloading(false);
    }
  };

  const canDelete = currentUserProfile?.role === 'admin';

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-2xl">Registro de Auditoría</CardTitle>
          <CardDescription>Visualización de registros almacenados en el servidor.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button asChild className="w-full md:w-auto">
            <Link href="/dashboard"><FilePlus className="mr-2 h-4 w-4" />Nueva Auditoría</Link>
          </Button>
          <DownloadAuditsButton audits={filteredAudits} />
           <Button variant="outline" onClick={handleMassPdfDownload} disabled={isDownloading || filteredAudits.length === 0} className="w-full md:w-auto">
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar PDFs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full mb-4 border rounded-lg px-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>Ver JSON de Auditorías (Datos del Servidor)</AccordionTrigger>
            <AccordionContent>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto max-h-[400px]">
                {JSON.stringify(audits, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Filtrar por fecha:</p>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                {years.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                {months.map((month) => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        {loading ? (
            <div className='flex justify-center items-center h-64'><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <AuditLogTable audits={filteredAudits} onDelete={canDelete ? handleDeleteAudit : undefined} />
        )}
      </CardContent>
    </Card>
  );
}