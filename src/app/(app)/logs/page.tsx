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
import { useToast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';
import { useCollection, useFirestore, useUser, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { AuditLogTable } from '@/components/audit-log-table';

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
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const auditsCollection = useMemoFirebase(() => collection(firestore, 'audits'), [firestore]);
  const { data: audits, isLoading: loading, error } = useCollection<Audit>(auditsCollection);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    if (authUser) {
      const userDocRef = doc(firestore, 'users', authUser.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setCurrentUserProfile(docSnap.data() as UserProfile);
        }
      });
    }
  }, [authUser, firestore]);

  const handleDeleteAudit = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, 'audits', id));
    toast({
      title: 'Auditoría Eliminada',
      description: 'El registro ha sido eliminado exitosamente.',
    });
  };

  const filteredAudits = useMemo(() => {
    if (!audits) return [];
    return audits.filter((audit) => {
      const auditDate = new Date(audit.createdAt);
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
      
      for (const audit of filteredAudits) {
        // Fetch auditor profile for each audit
        const auditorProfile = await getDoc(doc(firestore, 'users', audit.auditorId));
        const auditorData = auditorProfile.exists() ? auditorProfile.data() as UserProfile : null;

        const { jsPDF } = await import('jspdf');
        const docPDF = await generateAuditPdf(audit, null, auditorData, new jsPDF({
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
        <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Filtrar por fecha de creación:</p>
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
        </div>

        {loading ? (
            <div className='flex justify-center items-center h-64'>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
          <AuditLogTable audits={filteredAudits} onDelete={currentUserProfile?.role === 'admin' ? handleDeleteAudit : undefined} />
        )}
      </CardContent>
    </Card>
  );
}
