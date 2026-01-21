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
    // Log the error to the console for debugging, as recommended.
    console.error("Caught by application error boundary:", error);
  }, [error]);

  // Check for the specific Firebase configuration error.
  const isConfigError = error.message.includes('Firebase configuration is incomplete');

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">
            {isConfigError ? "Error de Configuración de Firebase" : "Se produjo un error en la aplicación"}
          </CardTitle>
          <CardDescription>
            {isConfigError
              ? "La aplicación no puede conectarse a Firebase porque una o más variables de configuración no están definidas en el entorno de producción."
              : "Lo sentimos, algo salió mal al intentar cargar la página."}
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
            {isConfigError
              ? "Por favor, ve a la configuración de tu backend en Firebase App Hosting y asegúrate de que todas las variables de entorno NEXT_PUBLIC_FIREBASE_* estén definidas correctamente."
              : "Puedes intentar recargar la página."
            }
          </p>
          <Button onClick={() => reset()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
