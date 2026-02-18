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
import { differenceInYears } from 'date-fns';
import { Textarea } from './ui/textarea';
import { useTransition, useEffect, useState, useMemo } from 'react';
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

const departmentOptions = ["CESAR", "MAGDALENA", "LA GUAJIRA", "OTRO"];

const MUNICIPALITIES_BY_DEPT: Record<string, string[]> = {
  "CESAR": [
    "BECERRIL", "CHIMICHAGUA", "CHIRIGUANA", "CURUMANÍ", "LA JAGUA DE IBIRICO", 
    "PAILITAS", "TAMALAMEQUE", "ASTREA", "BOSCONIA", "EL COPEY", "EL PASO", 
    "AGUSTÍN CODAZZI", "LA PAZ", "MANAURE", "PUEBLO BELLO", "SAN DIEGO", 
    "VALLEDUPAR", "AGUACHICA", "GAMARRA", "GONZÁLEZ", "LA GLORIA", "PELAYA", 
    "RÍO DE ORO", "SAN ALBERTO", "SAN MARTÍN", "OTRO"
  ],
  "LA GUAJIRA": [
    "ALBANIA", "DIBULLA", "MAICAO", "MANAURE", "RIOHACHA", "URIBIA", 
    "BARRANCAS", "DISTRACCION", "EL MOLINO", "FONSECA", "HATONUEVO", 
    "LA JAGUA DEL PILAR", "SAN JUAN DEL CESAR", "URUMITA", "VILLANUEVA", "OTRO"
  ],
  "MAGDALENA": [
    "ARIGUANÍ", "CHIBOLO", "NUEVA GRANADA", "PLATO", "SABANAS DE SAN ANGEL", 
    "TENERIFE", "ALGARROBO", "ARACATACA", "CIÉNAGA", "EL RETEN", "FUNDACION", 
    "PUEBLO VIEJO", "ZONA BANANERA", "CERRO SAN ANTONIO", "CONCORDIA", "EL PIÑON", 
    "PEDRAZA", "PIVIJAY", "REMOLINO", "SALAMINA", "SITIONUEVO", "ZAPAYAN", 
    "SANTA MARTA", "EL BANCO", "GUAMAL", "PIJIÑO DEL CARMEN", "SAN SEBASTIAN DE BUENAVISTA", 
    "SAN ZENON", "SANTA ANA", "SANTA BARBARA DE PINTO", "OTRO"
  ],
  "OTRO": ["OTRO"]
};

const ethnicityOptions = [
  "WAYUU", "WIWA", "KOGUI", "ARHUACO", "KANKUAMO", 
  "AFROCOLOMBIANO", "MESTIZO", "SIN ETNIA", "OTRO"
];

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
      followUpDate: '',
      department: '',
      otherDepartment: '',
      municipality: '',
      otherMunicipality: '',
      ethnicity: '',
      otherEthnicity: '',
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
        form.setValue('auditorName', profile.fullName || '');
    }
  }, [profile, form]);

  const selectedDepartment = form.watch('department');
  const selectedMunicipality = form.watch('municipality');
  const selectedEthnicity = form.watch('ethnicity');
  const birthDateValue = form.watch('birthDate');

  const municipalityOptions = useMemo(() => {
    if (!selectedDepartment) return [];
    return MUNICIPALITIES_BY_DEPT[selectedDepartment] || ["OTRO"];
  }, [selectedDepartment]);

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
      const finalDepartment = values.department === 'OTRO' ? values.otherDepartment : values.department;
      const finalMunicipality = values.municipality === 'OTRO' ? values.otherMunicipality : values.municipality;
      const finalEthnicity = values.ethnicity === 'OTRO' ? values.otherEthnicity : values.ethnicity;

      const auditData: Audit = {
        ...values,
        id: `AUD-${Date.now()}`,
        auditorId: profile?.uid || 'anonymous',
        createdAt: new Date().toISOString(),
        followUpDate: values.followUpDate || new Date().toISOString(),
        department: finalDepartment || '',
        municipality: finalMunicipality || '',
        ethnicity: finalEthnicity || '',
      } as Audit;

      const res = await saveAuditAction(auditData);
      
      if (res.success) {
        toast({ title: 'Auditoría Guardada Exitosamente' });
        form.reset();
        router.push('/logs');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al Guardar',
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
                <FormControl><Input {...field} value={field.value || ''} disabled /></FormControl>
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
                <FormControl><Input placeholder="Ej. Juan Pérez" {...field} value={field.value || ''} /></FormControl>
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
                <Select onValueChange={field.onChange} value={field.value || ''}>
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
                <FormControl><Input type="text" {...field} value={field.value || ''} /></FormControl>
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
                <Select onValueChange={field.onChange} value={field.value || ''}>
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
                <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="visitType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Visita</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PRIMERA VEZ">PRIMERA VEZ</SelectItem>
                    <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="CIERRE DE CASO">CIERRE DE CASO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl><Input type="text" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <Select onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue('municipality', '');
                  form.setValue('otherMunicipality', '');
                }} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departmentOptions.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedDepartment === 'OTRO' && (
            <FormField
              control={form.control}
              name="otherDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique Departamento</FormLabel>
                  <FormControl><Input placeholder="Ingrese el departamento" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="municipality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Municipio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedDepartment}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder={selectedDepartment ? "Seleccione Municipio" : "Elija Departamento"} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {municipalityOptions.map(mun => <SelectItem key={mun} value={mun}>{mun}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedMunicipality === 'OTRO' && (
            <FormField
              control={form.control}
              name="otherMunicipality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique Municipio</FormLabel>
                  <FormControl><Input placeholder="Ingrese el municipio" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="ethnicity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etnia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ethnicityOptions.map(eth => <SelectItem key={eth} value={eth}>{eth}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedEthnicity === 'OTRO' && (
            <FormField
              control={form.control}
              name="otherEthnicity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique Etnia</FormLabel>
                  <FormControl><Input placeholder="Ingrese la etnia" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
            control={form.control}
            name="followUpNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seguimiento</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ''} rows={4}/></FormControl>
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
                <FormControl><Textarea {...field} value={field.value || ''} rows={4}/></FormControl>
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