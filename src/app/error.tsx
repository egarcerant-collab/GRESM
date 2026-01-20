'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("Caught by error boundary:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">
            Se produjo un error en la aplicación
          </CardTitle>
          <CardDescription>
            Lo sentimos, algo salió mal al intentar cargar la página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/10 p-4 rounded-md text-left text-sm text-destructive overflow-x-auto">
            <p className="font-bold">Detalles del error:</p>
            <pre className="whitespace-pre-wrap font-mono mt-2">
              {error.message || 'No se proporcionó un mensaje de error.'}
            </pre>
          </div>
          <p className="text-muted-foreground">
            Puedes intentar recargar la página. Si el problema persiste, revisa la consola del navegador.
          </p>
          <Button onClick={() => reset()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
