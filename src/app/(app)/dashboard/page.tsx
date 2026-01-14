import { AuditForm } from '@/components/audit-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Crear Nueva Auditoría</CardTitle>
          <CardDescription>
            Complete el siguiente formulario para registrar una nueva entrada de auditoría. Todos los campos son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditForm />
        </CardContent>
      </Card>
    </div>
  );
}
