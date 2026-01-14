import { getAuditById } from '@/lib/db';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { AiAnalysis } from '@/components/ai-analysis';
import type { Audit } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="md:col-span-2 text-foreground">{value}</dd>
    </div>
  );
}

export default async function LogDetailPage({ params }: { params: { id: string } }) {
  const audit = await getAuditById(params.id);

  if (!audit) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/logs">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to logs</span>
          </Link>
        </Button>
        <h1 className="font-headline text-2xl text-foreground">Audit Details</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Audit ID: {audit.id}</CardTitle>
          <CardDescription>
            Recorded on {format(new Date(audit.createdAt), 'PPPp')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="divide-y divide-border">
                <DetailItem label="Auditor" value={audit.auditorName} />
                <DetailItem label="Patient" value={audit.patientName} />
                <DetailItem label="Document Type" value={audit.documentType} />
                <DetailItem label="Document Number" value={audit.documentNumber} />
                 <DetailItem label="Follow-up Date" value={format(new Date(audit.followUpDate), 'PPP')} />
                <DetailItem label="Visit Type" value={<Badge variant={audit.visitType === 'PRIMERA VEZ' ? 'secondary' : 'outline'} className="capitalize">{audit.visitType.toLowerCase().replace('_', ' ')}</Badge>} />
              </div>
               <div className="divide-y divide-border">
                <DetailItem label="Event" value={audit.event} />
                <DetailItem label="Event Details" value={audit.eventDetails} />
                <DetailItem label="Department" value={audit.department} />
                <DetailItem label="Municipality" value={audit.municipality} />
                <DetailItem label="Ethnicity" value={audit.ethnicity} />
                <DetailItem label="Address" value={audit.address} />
                <DetailItem label="Phone Number" value={audit.phoneNumber} />
              </div>
            </div>
            <div className="pt-4">
              <DetailItem label="Follow-up Notes" value={<p className="whitespace-pre-wrap">{audit.followUpNotes}</p>} />
            </div>
            <div className="pt-4">
              <DetailItem label="Next Steps" value={<p className="whitespace-pre-wrap">{audit.nextSteps}</p>} />
            </div>
          </dl>
        </CardContent>
      </Card>
      <AiAnalysis audit={audit as Audit} />
    </div>
  );
}
