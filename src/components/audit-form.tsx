
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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { useTransition, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { useUser } from '@/firebase';
import type { Audit } from '@/lib/types';
import { useRouter } from 'next/navigation';

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

const genderViolenceTypes = [
    "Violencia física",
    "Negligencia y abandono",
    "Acoso sexual",
    "Abuso sexual",
    "otros"
];

const departmentOptions = ["CESAR", "MAGDALENA", "LA GUAJIRA"];

const municipalitiesByDepartment: Record<string, string[]> = {
  CESAR: [
    "BECERRIL", "CHIMICHAGUA", "CHIRIGUANA", "CURUMANÍ", "LA JAGUA DE IBIRICO",
    "PAILITAS", "TAMALAMEQUE", "ASTREA", "BOSCONIA", "EL COPEY", "EL PASO",
    "AGUSTÍN CODAZZI", "LA PAZ", "MANAURE", "PUEBLO BELLO", "SAN DIEGO",
    "VALLEDUPAR", "AGUACHICA", "GAMARRA", "GONZÁLEZ", "LA GLORIA", "PELAYA",
    "RÍO DE ORO", "SAN ALBERTO", "SAN MARTÍN"
  ],
  "LA GUAJIRA": [
    "ALBANIA", "BARRANCAS", "DIBULLA", "DISTRACCION", "EL MOLINO", "FONSECA",
    "HATONUEVO", "LA JAGUA DEL PILAR", "MAICAO", "MANAURE", "RIOHACHA",
    "SAN JUAN DEL CESAR", "URIBIA", "URUMITA", "VILLANUEVA"
  ],
  MAGDALENA: [
    "ALGARROBO", "ARACATACA", "ARIGUANÍ", "CERRO SAN ANTONIO", "CHIBOLO",
    "CIÉNAGA", "CONCORDIA", "EL BANCO", "EL PIÑON", "EL RETEN", "FUNDACION",
    "GUAMAL", "NUEVA GRANADA", "PEDRAZA", "PIJIÑO DEL CARMEN", "PIVIJAY",
    "PLATO", "PUEBLO VIEJO", "REMOLINO", "SABANAS DE SAN ANGEL", "SALAMINA",
    "SAN SEBASTIAN DE BUENAVISTA", "SAN ZENON", "SANTA ANA", "SANTA BARBARA DE PINTO",
    "SANTA MARTA", "SITIONUEVO", "TENERIFE", "ZAPAYAN", "ZONA BANANERA"
  ],
};

const ethnicityOptions = [
  "YUKPA",
  "ARHUACO",
  "WIWA",
  "CHIMILA",
  "KANKUAMO",
  "WAYUU",
  "ZENU",
  "INGA",
  "SIN ETNIA",
  "INDIGENA",
];

export function AuditForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { profile } = useUser();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [maxBirthDate, setMaxBirthDate] = useState('');

  useEffect(() => {
    setIsClient(true);
    setMaxBirthDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);
  
  const [departmentSelection, setDepartmentSelection] = useState<string>('');
  const [municipalitySelection, setMunicipalitySelection] = useState<string>('');
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  const [ethnicitySelection, setEthnicitySelection] = useState<string>('');

  const form = useForm<z.infer<typeof auditSchema>>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      auditorName: '',
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

  const eventSelection = form.watch('event');
  const birthDateValue = form.watch('birthDate');
  const isOtherEvent = eventSelection === 'Otro';
  const isOtherDepartment = departmentSelection === 'Otro';
  const isOtherMunicipality = municipalitySelection === 'Otro';
  const isOtherEthnicity = ethnicitySelection === 'Otro';
  const showSpecialEventFields = eventSelection === 'Intento de Suicidio' || eventSelection === 'Consumo de Sustancia Psicoactivas';
  const isGenderViolenceEvent = eventSelection === 'Violencia de Género';

  useEffect(() => {
    if (departmentSelection && departmentSelection !== 'Otro') {
      form.setValue('department', departmentSelection);
      setAvailableMunicipalities(municipalitiesByDepartment[departmentSelection] || []);
    }
    form.setValue('municipality', '');
    setMunicipalitySelection('');
  }, [departmentSelection, form]);
  
  useEffect(() => {
    if (municipalitySelection && municipalitySelection !== 'Otro') {
      form.setValue('municipality', municipalitySelection);
    }
  }, [municipalitySelection, form]);

  useEffect(() => {
    if (ethnicitySelection && ethnicitySelection !== 'Otro') {
      form.setValue('ethnicity', ethnicitySelection);
    }
  }, [ethnicitySelection, form]);

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
      try {
        const auditData: Audit = {
          ...values,
          id: `AUD-${Date.now()}`,
          auditorId: profile?.uid || 'anonymous',
          createdAt: new Date().toISOString(),
          followUpDate: values.followUpDate || new Date().toISOString(),
        } as Audit;

        // GUARDADO PERDURANTE EN LOCALSTORAGE
        const existingAudits = JSON.parse(localStorage.getItem('audit-data-storage') || '[]');
        existingAudits.push(auditData);
        localStorage.setItem('audit-data-storage', JSON.stringify(existingAudits));

        toast({
            title: 'Auditoría Guardada',
            description: 'El registro se ha guardado permanentemente en tu navegador.',
        });
        form.reset();
        router.push('/logs');
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: 'Error al Guardar',
          description: 'Ocurrió un error inesperado.',
        });
      }
    });
  }

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

          <div className='md:col-span-2 grid md:grid-cols-2 gap-8'>
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select onValueChange={setDepartmentSelection} value={departmentSelection}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl>
                <SelectContent>
                  {departmentOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            {isOtherDepartment && (
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especifique</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input type="number" {...field} /></FormControl>
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
