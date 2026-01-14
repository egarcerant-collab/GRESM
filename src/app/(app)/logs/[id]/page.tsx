'use server';

import LogDetailClient from '@/components/log-detail-client';
import { getAuditByIdAction } from '@/app/actions';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

type PageProps = {
  params: { id: string };
};

export default async function LogDetailPage({ params }: PageProps) {
  const { id } = params;
  const { audit } = await getAuditByIdAction(id);

  if (!audit) {
    notFound();
  }

  const formattedCreatedAt = format(new Date(audit.createdAt), 'PPPp');

  return <LogDetailClient audit={audit} formattedCreatedAt={formattedCreatedAt} />;
}
