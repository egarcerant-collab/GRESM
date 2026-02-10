import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ShieldOff } from 'lucide-react';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'Aplicación No Disponible',
  description: 'Esta aplicación ha sido despublicada.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={ptSans.variable} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <ShieldOff className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold text-foreground">
                Aplicación Despublicada
            </h1>
            <p className="mt-2 text-muted-foreground max-w-md">
                Este sitio ha sido puesto fuera de línea temporalmente por el administrador.
            </p>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
