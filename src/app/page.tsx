
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the dashboard since login is removed.
  redirect('/dashboard');
}
