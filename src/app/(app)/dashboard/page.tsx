
import { getCurrentUser } from '@/app/actions';
import { redirect } from 'next/navigation';
import { KpiDashboardClient } from '@/components/kpi-dashboard-client';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    // This case should be handled by middleware, but as a safeguard
    redirect('/login');
  }

  return <KpiDashboardClient user={user} />;
}
