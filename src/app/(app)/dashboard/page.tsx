
import { getCurrentUser } from '@/app/actions';
import { redirect } from 'next/navigation';
import { KpiDashboardClient } from '@/components/kpi-dashboard-client';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    // This case should be handled by middleware, but as a safeguard
    redirect('/login');
  }

  // The 'user' object from the session now drives the dashboard
  return <KpiDashboardClient user={user} />;
}
