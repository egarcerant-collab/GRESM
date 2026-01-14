import { getAudits } from '@/lib/db';
import { AuditLogTable } from '@/components/audit-log-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePlus } from 'lucide-react';

export default async function LogsPage() {
  const audits = await getAudits();

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-2xl">Registro de Auditoría</CardTitle>
          <CardDescription>
            Una lista de todas las entradas de auditoría registradas. Haga clic en 'Ver' para ver los detalles y el análisis de la IA.
          </CardDescription>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/dashboard">
            <FilePlus className="mr-2 h-4 w-4" />
            Nueva Auditoría
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <AuditLogTable audits={audits} />
      </CardContent>
    </Card>
  );
}
