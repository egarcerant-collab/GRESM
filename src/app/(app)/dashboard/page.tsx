import { AuditForm } from '@/components/audit-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FilePlus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <FilePlus />
          Nueva Auditoría
        </CardTitle>
        <CardDescription>
          Rellene el siguiente formulario para registrar una nueva entrada de auditoría.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuditForm />
      </CardContent>
    </Card>
  );
}
