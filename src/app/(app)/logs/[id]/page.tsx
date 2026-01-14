import LogDetailClient from '@/components/log-detail-client';
import { getAuditByIdAction } from '@/app/actions';
import { notFound } from 'next/navigation';

type PageProps = {
  params: { id: string };
};

export default async function LogDetailPage({ params }: PageProps) {
  const { id } = params;
  const { audit } = await getAuditByIdAction(id);

  if (!audit) {
    notFound();
  }

  return <LogDetailClient audit={audit} />;
}
