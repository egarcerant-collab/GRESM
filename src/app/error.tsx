'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Caught by application error boundary:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-destructive">Lo sentimos, algo salió mal.</h2>
          <p className="mt-4 text-muted-foreground">
              Hemos encontrado un error inesperado al intentar cargar esta página. Puedes intentar recargar el componente o volver a intentarlo más tarde.
          </p>
          <p className="mt-4 text-xs text-muted-foreground/50">
            Detalles del error: {error.message}
          </p>
          <Button
              onClick={() => reset()}
              className="mt-6"
          >
              <RefreshCw className="mr-2 h-4 w-4" />
              Volver a intentar
          </Button>
      </div>
    </div>
  );
}
