
import { redirect } from 'next/navigation';

export default function HomePage() {
  // The middleware will handle the redirection based on auth status.
  // This is just a fallback.
  redirect('/login');
}
