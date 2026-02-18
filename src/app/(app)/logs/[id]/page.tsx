
'use client';

import LogDetailClient from '@/components/log-detail-client';
import type { Audit } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type PageProps = {
  params: { id: string };
};

export default function LogDetailPage({ params }: PageProps) {
  const { id } = params;
  const db = useFirestore();

  const auditRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'audits', id);
  }, [db, id]);

  const { data: audit, isLoading } = useDoc<Audit>(auditRef);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!audit) {
    notFound();
  }

  return <LogDetailClient audit={audit} />;
}
