'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { Audit } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

export function AuditLogTable({ audits, onDelete }: { audits: Audit[], onDelete?: (id: string) => void }) {
  const router = useRouter();

  if (audits.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold text-foreground">No audit logs found.</h3>
        <p className="mb-4 mt-2">Get started by creating a new audit entry.</p>
        <Button onClick={() => router.push('/dashboard')}>
          Create First Audit
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">ID</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead className="hidden md:table-cell">Event</TableHead>
          <TableHead className="hidden sm:table-cell">Follow-up Date</TableHead>
          <TableHead className="hidden sm:table-cell">Visit Type</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {audits.map((audit) => (
          <TableRow key={audit.id} className="hover:bg-muted/50">
            <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.id}</TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.patientName}</TableCell>
            <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{audit.event}</TableCell>
            <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>{format(new Date(audit.followUpDate), 'PP')}</TableCell>
            <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/logs/${audit.id}`)}>
              <Badge variant={audit.visitType === 'PRIMERA VEZ' ? 'secondary' : 'outline'} className="capitalize">
                {audit.visitType.toLowerCase().replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" aria-label="View Details" onClick={() => router.push(`/logs/${audit.id}`)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
