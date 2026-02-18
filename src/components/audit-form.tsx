'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { auditSchema } from '@/lib/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2 } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { Textarea } from './ui/textarea';
import { useTransition, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import type { Audit } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { saveAuditAction } from '@/app/actions';

const documentTypes = [
  "CC: Cédula de Ciudadanía", 
  "TI: Tarjeta de Identidad", 
  "RC: Registro Civil", 
  "CE: Cédula de Extranjería", 
  "PA: Pasaporte",
  "PE: Permiso Especial de Permanencia",
  "AS: Adulto sin Identificación",
  "MS: Menor sin Identificación"
];

const eventTypes = [
  "Consumo de Sustancia Psicoactivas",
  "Intento de Suicidio",
  "Violencia de Género",
  "Salud Mental General",
  "Otro"
];

const departmentOptions = ["CESAR", "MAGDALENA", "LA GUAJIRA"];

export function AuditForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { profile } = useUser();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const form = useForm<z.infer<typeof auditSchema>>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      auditorName: profile?.fullName || '',
      patientName: '',
      documentType: '',
      documentNumber: '',
      event: '',
      eventDetails: '',
      department: '',
      municipality: '',
      ethnicity: '',
      address: '',
      phoneNumber: '',
      followUpNotes: '',
      nextSteps: '',
      visitType: 'Seguimiento',
      birthDate: '',
      age: 0,
      sex: 'Masculino',
      affiliationStatus: 'Activa',
      area: 'Rural',
      settlement: '',
      nationality: '',
      primaryHealthProvider: '',
      regime: 'Subsidiado',
      upgdProvider: '',
      followUpInterventionType: '',
      genderViolenceType: '',
      genderViolenceTypeDetails: '',
    },
  });
  
  useEffect(() => {
    if (profile) {
        form.setValue('auditorName', profile.fullName);
    }
  }, [profile, form]);

  const birthDateValue = form.watch('birthDate');

  useEffect(() => {
    if (birthDateValue) {
      try {
        const age = differenceInYears(new Date(), new Date(`${birthDateValue}T00:00:00`));
        form.setValue('age', age >= 0 ? age : 0);
      } catch (e) {
        form.setValue('age', 0);
      }
    }
  }, [birthDateValue, form]);

  function onSubmit(values: z.infer<typeof auditSchema>) {
    startTransition(async () => {
      const auditData: Audit = {
        ...values,
        id: `AUD-${Date.now()}`,
        auditorId: profile?.uid || 'anonymous',
        createdAt: new Date().toISOString(),
        followUpDate: values.followUpDate || new Date().toISOString(),
      } as Audit;

      const res = await saveAuditAction(auditData);
      
      if (res.success) {
        toast({ title: 'Auditoría Guardada en JSON' });
        form.reset();
        router.push('/logs');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al Guardar en Servidor',
          description: res.error || 'Ocurrió un error inesperado.',
        });
      }
    });
  }

  if (!isClient) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="auditorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Auditor</FormLabel>
                <FormControl><Input {...field} disabled /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Paciente</FormLabel>
                <FormControl><Input placeholder="e.g., Juan Perez" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Documento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Documento</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <FormField
            control={form.control}
            name="event"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccione evento" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="followUpDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Seguimiento</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="followUpNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seguimiento</FormLabel>
                <FormControl><Textarea {...field} rows={4}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
            control={form.control}
            name="nextSteps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conducta a Seguir</FormLabel>
                <FormControl><Textarea {...field} rows={4}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Auditoría
          </Button>
        </div>
      </form>
    </Form>
  );
}
