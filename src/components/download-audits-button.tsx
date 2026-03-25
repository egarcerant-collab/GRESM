'use client';

import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import type { Audit } from '@/lib/types';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

export function DownloadAuditsButton({ audits }: { audits: Audit[] }) {
  const handleDownload = () => {
    // Sanitize data for Excel
    const dataToExport = audits.map(audit => {
      // Create a new object to avoid mutating the original audit object
      const sanitizedAudit: any = { ...audit };
      
      // Convert Date objects to formatted strings
      sanitizedAudit.followUpDate = format(new Date(audit.followUpDate), 'yyyy-MM-dd');
      sanitizedAudit.createdAt = format(new Date(audit.createdAt), 'yyyy-MM-dd HH:mm:ss');
      
      return sanitizedAudit;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditorias');
    XLSX.writeFile(workbook, 'auditorias.xlsx');
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={audits.length === 0}
      className="w-full md:w-auto"
    >
      <Download className="mr-2 h-4 w-4" />
      Descargar XLS
    </Button>
  );
}
