
'use client';

import LogDetailClient from '@/components/log-detail-client';
import { useDoc, useFirestore, useMemoFirebase, doc } from '@/local';
import type { Audit } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { id: string };
};

export default function LogDetailPage({ params }: PageProps) {
  const { id } = params;
  const firestore = useFirestore();
  const auditDocRef = useMemoFirebase(() => doc(firestore, 'audits', id), [firestore, id]);
  const { data: audit, isLoading, error } = useDoc<Audit>(auditDocRef);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    console.error(error);
    return <div className="text-destructive">Error al cargar la auditoría.</div>
  }

  if (!audit) {
    notFound();
  }

  return <LogDetailClient audit={audit} />;
}
