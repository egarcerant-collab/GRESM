'use client';

import { useState, useEffect } from 'react';
import LogDetailClient from '@/components/log-detail-client';
import type { Audit } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getAuditByIdAction } from '@/app/actions';


type PageProps = {
  params: { id: string };
};

export default function LogDetailPage({ params }: PageProps) {
  const { id } = params;
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAudit() {
      setIsLoading(true);
      try {
        const foundAudit = await getAuditByIdAction(id);
        setAudit(foundAudit);
      } catch (e) {
        console.error("Failed to load audit", e);
        setAudit(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAudit();
  }, [id]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!audit) {
    notFound();
  }

  return <LogDetailClient audit={audit} />;
}
