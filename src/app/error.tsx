'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging, as recommended.
    console.error("Caught by application error boundary:", error);
  }, [error]);

  // Returning null to hide the error overlay as requested.
  return null;
}
