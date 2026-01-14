'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { createAuditAction } from '@/app/actions';
import { useTransition, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const documentTypes = [
  "CC: Cédula de Ciudadanía", 
  "TI: Tarjeta de Identidad", 
  "RC: Registro Civil", 
  "CE: Cédula de Extranjería", 
  "PA: Pasaporte"
];

const eventTypes = [
  "Consumo de Sustancia Psicoactivas",
  "Intento de Suicidio",
  "Violencia de Género",
  "Salud Mental General",
  "Otro"
];

const departmentOptions = ["CESAR", "MAGDALENA", "LA GUAJIRA"];
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
  "Otro"
];

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


export function AuditForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [departmentSelection, setDepartmentSelection] = useState<string | undefined>('');
  const [municipalitySelection, setMunicipalitySelection] = useState<string | undefined>('');
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  const isOtherDepartment = departmentSelection === 'Otro';
  const isOtherMunicipality = municipalitySelection === 'Otro';

  const [ethnicitySelection, setEthnicitySelection] = useState<string | undefined>('');
  const isOtherEthnicity = ethnicitySelection === 'Otro';

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
    },
  });

  const eventSelection = form.watch('event');
  const isOtherEvent = eventSelection === 'Otro';

  useEffect(() => {
    if (departmentSelection && departmentSelection !== 'Otro') {
      form.setValue('department', departmentSelection);
      setAvailableMunicipalities(municipalitiesByDepartment[departmentSelection] || []);
    } else {
      form.setValue('department', '');
      setAvailableMunicipalities([]);
    }
    // Reset municipality when department changes
    form.setValue('municipality', '');
    setMunicipalitySelection('');
  }, [departmentSelection, form]);
  
  useEffect(() => {
    if (municipalitySelection !== 'Otro') {
      form.setValue('municipality', municipalitySelection || '');
    } else {
      form.setValue('municipality', '');
    }
  }, [municipalitySelection, form]);

  useEffect(() => {
    if (ethnicitySelection !== 'Otro') {
      form.setValue('ethnicity', ethnicitySelection || '');
    } else {
      form.setValue('ethnicity', '');
    }
  }, [ethnicitySelection, form]);


  function onSubmit(values: z.infer<typeof auditSchema>) {
    startTransition(async () => {
      const result = await createAuditAction(values);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error al crear la auditoría',
          description: result.error,
        });
      } else {
        // Redirect is handled by the server action
        toast({
          title: 'Auditoría Creada',
          description: 'La auditoría ha sido registrada exitosamente.',
        });
        form.reset();
        setDepartmentSelection('');
        setMunicipalitySelection('');
        setEthnicitySelection('');
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
                <FormControl>
                  <Input placeholder="e.g., Alice Plata" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input placeholder="e.g., Cristhian Bello Diaz" {...field} />
                </FormControl>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo de documento" />
                    </SelectTrigger>
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
                <FormControl>
                  <Input type="number" placeholder="e.g., 1006895977" {...field} />
                </FormControl>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un evento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           {isOtherEvent && (
            <FormField
              control={form.control}
              name="eventDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique el Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SPA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
           <FormField
            control={form.control}
            name="followUpDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Seguimiento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visitType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Visita</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-x-4 gap-y-2 pt-2"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="PRIMERA VEZ" />
                      </FormControl>
                      <FormLabel className="font-normal">Primera Vez</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Seguimiento" />
                      </FormControl>
                      <FormLabel className="font-normal">Seguimiento</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="CIERRE DE CASO" />
                      </FormControl>
                      <FormLabel className="font-normal">Cierre de caso</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Departamento</FormLabel>
            <Select onValueChange={setDepartmentSelection} value={departmentSelection}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un departamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departmentOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
           {isOtherDepartment && (
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique el Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cundinamarca" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {availableMunicipalities.length > 0 && !isOtherDepartment ? (
            <FormItem>
              <FormLabel>Municipio</FormLabel>
              <Select onValueChange={setMunicipalitySelection} value={municipalitySelection}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un municipio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableMunicipalities.map(muni => <SelectItem key={muni} value={muni}>{muni}</SelectItem>)}
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {isOtherMunicipality && (
                <FormField
                  control={form.control}
                  name="municipality"
                  render={({ field }) => (
                    <FormItem className='pt-2'>
                       <FormLabel>Especifique el Municipio</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BOGOTA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormItem>
          ) : (
            <FormField
              control={form.control}
              name="municipality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MAICAO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormItem>
            <FormLabel>Etnia</FormLabel>
            <Select onValueChange={setEthnicitySelection} value={ethnicitySelection}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una etnia" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ethnicityOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
           {isOtherEthnicity && (
            <FormField
              control={form.control}
              name="ethnicity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especifique la Etnia</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MESTIZO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., OVIDIO MEJIA CALLE 36" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número Telefónico</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 3215402336" {...field} />
                </FormControl>
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
                <FormControl>
                  <Textarea placeholder="Describa el seguimiento realizado..." {...field} rows={6}/>
                </FormControl>
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
                <FormControl>
                  <Textarea placeholder="Describa la conducta a seguir..." {...field} rows={4}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Auditoría
          </Button>
        </div>
      </form>
    </Form>
  );
}
