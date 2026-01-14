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
          <CardTitle className="font-headline text-2xl">Create New Audit</CardTitle>
          <CardDescription>
            Fill out the form below to log a new audit entry. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditForm />
        </CardContent>
      </Card>
    </div>
  );
}
