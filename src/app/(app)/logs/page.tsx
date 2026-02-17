'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
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
import { useUser, useFirestore, useMemoFirebase, useCollection, deleteDocumentNonBlocking } from '@/firebase';
import { AuditLogTable } from '@/components/audit-log-table';
import { isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import mockUsersData from '@/lib/data/users.json';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { collection, doc } from 'firebase/firestore';


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
  const firestore = useFirestore();
  
  const auditsCollection = useMemoFirebase(() => collection(firestore, 'audits'), [firestore]);
  const { data: audits, isLoading: loading, error } = useCollection<Audit>(auditsCollection);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
    setSelectedYear(new Date().getFullYear().toString());
  }, []);

  const handleDeleteAudit = (id: string) => {
    try {
        const docRef = doc(firestore, 'audits', id);
        deleteDocumentNonBlocking(docRef);
        toast({
            title: "Auditoría Eliminada",
            description: "El registro ha sido eliminado permanentemente.",
        });
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Error al eliminar",
            description: "No se pudo eliminar de la base de datos.",
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
        description: 'No hay auditorías que coincidan con los filtros.',
      });
      return;
    }
  
    setIsDownloading(true);
    toast({
      title: 'Generando PDFs...',
      description: `Preparando ${filteredAudits.length} informes.`,
    });
  
    try {
      const zip = new JSZip();
      const backgroundImage = await getImageAsBase64Action('/imagenes/IMAGEN UNIFICADA.jpg');
      
      for (const audit of filteredAudits) {
        const auditorData = mockUsersData.find(u => u.uid === audit.auditorId) || null;

        const { jsPDF } = await import('jspdf');
        const docPDF = await generateAuditPdf(audit, backgroundImage, auditorData as UserProfile | null, new jsPDF({
          orientation: "p",
          unit: "pt",
          format: "a4"
        }));
        const pdfBlob = docPDF.output('blob');
        const fileName = `Informe_${audit.id}.pdf`;
        zip.file(fileName, pdfBlob);
      }
  
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Informes_${selectedYear}.zip`);
  
      toast({ title: 'Descarga Completa' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al generar PDFs',
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
          <CardTitle className="font-headline text-2xl">Registro de Auditoría</CardTitle>
          <CardDescription>Una lista de todas las entradas guardadas en la base de datos real.</CardDescription>
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
            <AccordionTrigger>Ver JSON de Auditorías (Base de Datos Real)</AccordionTrigger>
            <AccordionContent>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                {JSON.stringify(audits, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg min-h-[72px]">
            <p className="text-sm font-medium">Filtrar por fecha:</p>
            {isClient ? (
              <>
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
              </>
            ) : (
              <Skeleton className="h-10 w-[300px]" />
            )}
        </div>

        {loading ? (
            <div className='flex justify-center items-center h-64'><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
            <div className="text-center text-destructive py-16 border-2 border-dashed rounded-lg">
              <AlertTriangle className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-xl font-semibold">Error al Cargar desde la Nube</h3>
              <p className="mt-2 text-sm">Asegúrese de que Firestore esté configurado.</p>
            </div>
        ) : (
          <AuditLogTable audits={filteredAudits} onDelete={canDelete ? handleDeleteAudit : undefined} />
        )}
      </CardContent>
    </Card>
  );
}