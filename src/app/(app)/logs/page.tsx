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
          <CardTitle className="font-headline text-2xl">Audit Log</CardTitle>
          <CardDescription>
            A list of all recorded audit entries. Click 'View' to see details and AI analysis.
          </CardDescription>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/dashboard">
            <FilePlus className="mr-2 h-4 w-4" />
            New Audit
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <AuditLogTable audits={audits} />
      </CardContent>
    </Card>
  );
}
