
'use client';

import { getAuditById } from '@/lib/db';
import { notFound, useRouter } from 'next/navigation';
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
import { ArrowLeft, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { deleteAuditAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import React from 'react';


function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="md:col-span-2 text-foreground">{value}</dd>
    </div>
  );
}

export default function LogDetailPage({ params }: { params: { id: string } }) {
  const [audit, setAudit] = React.useState<Audit | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    getAuditById(params.id).then(data => {
      if (data) {
        setAudit(data);
      } else {
        notFound();
      }
    });
  }, [params.id]);


  const handleDelete = async () => {
    if (audit) {
      const result = await deleteAuditAction(audit.id);
      if (result.success) {
        toast({
          title: 'Audit Deleted',
          description: 'The audit log has been successfully deleted.',
        });
        router.push('/logs');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Deleting Audit',
          description: result.error,
        });
      }
    }
  };

  if (!audit) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/logs">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to logs</span>
            </Link>
          </Button>
          <h1 className="font-headline text-2xl text-foreground">Audit Details</h1>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the audit log.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
