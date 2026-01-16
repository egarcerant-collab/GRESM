
import { ShieldCheck } from "lucide-react";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="absolute inset-0 bg-muted/50 -z-10" />
        <div className="w-full max-w-sm p-8">
            <div className="mb-8 flex flex-col items-center text-center">
                <ShieldCheck className="h-12 w-12 text-primary" />
                <h1 className="mt-4 text-3xl font-bold font-headline text-foreground">
                    Audit Logger
                </h1>
                <p className="text-muted-foreground">Bienvenido de nuevo. Inicia sesión para continuar.</p>
            </div>
            {children}
        </div>
    </div>
  );
}
