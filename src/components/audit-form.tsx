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
import { createAuditAction, checkExistingPatientAction } from '@/app/actions';
import { useTransition, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';

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

const upgdProviderOptions = [
    "UNIPSSAM IPS | Especialistas en Salud Mental",
    "IPS Vital Salud Guajira S.A.S.",
    "Insecar - Instituto Neuropsiquiatrico Nuestra Señora del Carmen"
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
  const { user } = useAuth();
  const [departmentSelection, setDepartmentSelection] = useState<string>('');
  const [municipalitySelection, setMunicipalitySelection] = useState<string>('');
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  const [ethnicitySelection, setEthnicitySelection] = useState<string>('');
  const [upgdProviderSelection, setUpgdProviderSelection] = useState<string>('');

  const [isCheckingPatient, setIsCheckingPatient] = useState(false);
  const [patientWarning, setPatientWarning] = useState<string | null>(null);

  const form = useForm<z.infer<typeof auditSchema>>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      auditorName: user?.fullName || user?.username || '',
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
      birthDate: undefined,
      age: undefined,
      sex: undefined,
      affiliationStatus: '',
      area: undefined,
      settlement: '',
      nationality: '',
      primaryHealthProvider: '',
      regime: undefined,
      upgdProvider: '',
      followUpInterventionType: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue('auditorName', user.fullName || user.username || '');
    }
  }, [user, form]);

  const eventSelection = form.watch('event');
  const documentNumberValue = form.watch('documentNumber');
  const visitTypeValue = form.watch('visitType');
  const isOtherEvent = eventSelection === 'Otro';
  const isOtherDepartment = departmentSelection === 'Otro';
  const isOtherMunicipality = municipalitySelection === 'Otro';
  const isOtherEthnicity = ethnicitySelection === 'Otro';
  const isOtherUpgdProvider = upgdProviderSelection === 'Otro';
  const showSpecialEventFields = eventSelection === 'Intento de Suicidio' || eventSelection === 'Consumo de Sustancia Psicoactivas';

  useEffect(() => {
    const checkPatient = async () => {
      if (visitTypeValue === 'PRIMERA VEZ' && documentNumberValue && documentNumberValue.length > 5) {
        setIsCheckingPatient(true);
        const { exists } = await checkExistingPatientAction(documentNumberValue);
        if (exists) {
          setPatientWarning('Advertencia: ya existe un registro de primera vez para este documento.');
        } else {
          setPatientWarning(null);
        }
        setIsCheckingPatient(false);
      } else {
        setPatientWarning(null);
      }
    };

    const handler = setTimeout(() => {
        checkPatient();
    }, 500); // Debounce check

    return () => {
        clearTimeout(handler);
    };
}, [documentNumberValue, visitTypeValue]);

  useEffect(() => {
    if (departmentSelection && departmentSelection !== 'Otro') {
      form.setValue('department', departmentSelection);
      setAvailableMunicipalities(municipalitiesByDepartment[departmentSelection] || []);
    } else if (departmentSelection !== 'Otro') {
      setAvailableMunicipalities([]);
      form.setValue('department', '');
    }
    // Reset municipality when department changes
    form.setValue('municipality', '');
    setMunicipalitySelection('');
  }, [departmentSelection, form]);
  
  useEffect(() => {
    if (municipalitySelection && municipalitySelection !== 'Otro') {
      form.setValue('municipality', municipalitySelection);
    } else if (municipalitySelection !== 'Otro') {
       form.setValue('municipality', '');
    }
  }, [municipalitySelection, form]);

  useEffect(() => {
    if (ethnicitySelection && ethnicitySelection !== 'Otro') {
      form.setValue('ethnicity', ethnicitySelection);
    } else if (ethnicitySelection !== 'Otro') {
      form.setValue('ethnicity', '');
    }
  }, [ethnicitySelection, form]);

  useEffect(() => {
    if (upgdProviderSelection && upgdProviderSelection !== 'Otro') {
      form.setValue('upgdProvider', upgdProviderSelection);
    } else if (upgdProviderSelection !== 'Otro') {
      form.setValue('upgdProvider', '');
    }
  }, [upgdProviderSelection, form]);


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
        setUpgdProviderSelection('');
        setPatientWarning(null);
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
                 {isCheckingPatient ? (
                    <FormDescription>Verificando...</FormDescription>
                ) : patientWarning ? (
                    <p className="text-sm font-medium text-yellow-600">{patientWarning}</p>
                ) : null}
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
           <div className='md:col-span-2 grid md:grid-cols-2 gap-8'>
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
          </div>
          
           <div className='md:col-span-2 grid md:grid-cols-2 gap-8'>
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
              </FormItem>
            ) : (
               !isOtherDepartment && <div /> 
            )}
             {(isOtherMunicipality || isOtherDepartment) && (
              <FormField
                control={form.control}
                name="municipality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especifique el Municipio</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BOGOTA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className='md:col-span-2 grid md:grid-cols-2 gap-8'>
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
                   <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
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

        {showSpecialEventFields && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Información Adicional de Evento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Elige una fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edad</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 25" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="sex" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccione el sexo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="affiliationStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Afiliación</FormLabel>
                      <FormControl><Input placeholder="e.g., Activo" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccione el área" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Rural">Rural</SelectItem>
                          <SelectItem value="Urbano">Urbano</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="settlement" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asentamiento</FormLabel>
                      <FormControl><Input placeholder="e.g., Urbano" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="nationality" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nacionalidad</FormLabel>
                      <FormControl><Input placeholder="e.g., Colombiana" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="primaryHealthProvider" render={({ field }) => (
                    <FormItem>
                      <FormLabel>IPS Atención Primaria</FormLabel>
                      <FormControl><Input placeholder="e.g., IPS Principal" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="regime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régimen</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccione el régimen" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Subsidiado">Subsidiado</SelectItem>
                          <SelectItem value="Contributivo">Contributivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="lg:col-span-2 grid md:grid-cols-2 gap-8 items-start">
                    <FormItem>
                      <FormLabel>Nombre UPGD o Prestador</FormLabel>
                      <Select onValueChange={setUpgdProviderSelection} value={upgdProviderSelection}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un prestador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {upgdProviderOptions.map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              {provider}
                            </SelectItem>
                          ))}
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                    {isOtherUpgdProvider && (
                      <FormField
                          control={form.control}
                          name="upgdProvider"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Especifique el prestador</FormLabel>
                              <FormControl>
                                  <Input placeholder="Nombre del prestador" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                    )}
                </div>

                <FormField control={form.control} name="followUpInterventionType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Intervención</FormLabel>
                      <FormControl><Input placeholder="e.g., Psicología" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Separator />
          </>
        )}

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
          <Button type="submit" disabled={isPending || isCheckingPatient || !!patientWarning}>
            {(isPending || isCheckingPatient) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Auditoría
          </Button>
        </div>
      </form>
    </Form>
  );
}
