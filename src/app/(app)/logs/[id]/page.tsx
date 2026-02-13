'use client';

import { useState, useEffect } from 'react';
import LogDetailClient from '@/components/log-detail-client';
import type { Audit } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';


type PageProps = {
  params: { id: string };
};

export default function LogDetailPage({ params }: PageProps) {
  const { id } = params;
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/data/audits.json', { cache: 'no-store' }) // Disable cache to get fresh data
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then((allAudits: Audit[]) => {
        const foundAudit = allAudits.find(a => a.id === id);
        setAudit(foundAudit || null);
      })
      .catch(e => {
        console.error("Failed to load audit from file", e);
        setAudit(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!audit) {
    notFound();
  }

  return <LogDetailClient audit={audit} />;
}
