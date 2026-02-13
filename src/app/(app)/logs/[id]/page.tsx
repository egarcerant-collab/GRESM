'use client';

import { useState, useEffect } from 'react';
import LogDetailClient from '@/components/log-detail-client';
import type { Audit } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import mockAuditsData from '@/lib/data/audits.json';


type PageProps = {
  params: { id: string };
};

export default function LogDetailPage({ params }: PageProps) {
  const { id } = params;
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
        const storedAudits = localStorage.getItem('mockAudits');
        // Fallback to mockAuditsData if localStorage is empty
        const allAudits = storedAudits ? JSON.parse(storedAudits) : mockAuditsData;
        const foundAudit = (allAudits as Audit[]).find(a => a.id === id);
        setAudit(foundAudit || null);
    } catch (e) {
        console.error("Failed to load audit from localStorage", e);
        setAudit(null);
    } finally {
        setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!audit) {
    notFound();
  }

  return <LogDetailClient audit={audit} />;
}
