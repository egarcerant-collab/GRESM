
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export const auditSchema = z.object({
  auditorName: z.string().min(2, { message: 'El nombre del auditor es requerido.' }),
  patientName: z.string().min(2, { message: 'El nombre del paciente es requerido.' }),
  documentType: z.string({ required_error: 'Seleccione un tipo de documento.' }).min(1, { message: 'Seleccione un tipo de documento.' }),
  documentNumber: z.string().min(5, { message: 'El número de documento es requerido.' }).regex(/^[0-9]+$/, "Solo se permiten números."),
  event: z.string({ required_error: 'Seleccione un evento.' }).min(1, { message: 'Seleccione un evento.' }),
  eventDetails: z.string().optional(),
  followUpDate: z.string({ required_error: 'La fecha de seguimiento es requerida.' }),
  visitType: z.enum(['PRIMERA VEZ', 'Seguimiento', 'CIERRE DE CASO'], { required_error: 'Seleccione el tipo de visita.' }),
  department: z.string().min(2, { message: 'El departamento es requerido.' }),
  municipality: z.string().min(2, { message: 'El municipio es requerido.' }),
  ethnicity: z.string().min(2, { message: 'La etnia es requerida.' }),
  address: z.string().min(5, { message: 'La dirección es requerida.' }),
  phoneNumber: z.string().min(7, { message: 'El número de teléfono es requerido.' }).regex(/^[0-9]+$/, "Solo se permiten números."),
  followUpNotes: z.string().min(10, { message: 'Las notas de seguimiento son requeridas.' }),
  nextSteps: z.string().min(10, { message: 'La conducta a seguir es requerida.' }),

  // Campos condicionales
  birthDate: z.string().optional(),
  age: z.coerce.number().optional(),
  sex: z.enum(['Masculino', 'Femenino']).optional(),
  affiliationStatus: z.enum(['Activa', 'Inactiva']).optional(),
  area: z.enum(['Rural', 'Urbano']).optional(),
  settlement: z.string().optional(),
  nationality: z.string().optional(),
  primaryHealthProvider: z.string().optional(),
  regime: z.enum(['Subsidiado', 'Contributivo']).optional(),
  upgdProvider: z.string().optional(),
  followUpInterventionType: z.string().optional(),
  genderViolenceType: z.string().optional(),
  genderViolenceTypeDetails: z.string().optional(),

}).refine(data => {
    if (data.event === 'Otro') {
        return !!data.eventDetails && data.eventDetails.length >= 2;
    }
    return true;
}, {
    message: 'Especifique el evento.',
    path: ['eventDetails'],
}).refine(data => {
    const specialEvent = data.event === 'Intento de Suicidio' || data.event === 'Consumo de Sustancia Psicoactivas';
    if (specialEvent) {
        return (
            data.birthDate &&
            data.age !== undefined &&
            data.sex &&
            data.affiliationStatus &&
            data.area &&
            data.settlement &&
            data.nationality &&
            data.primaryHealthProvider &&
            data.regime &&
            data.upgdProvider && data.upgdProvider.length > 0 &&
            data.followUpInterventionType
        );
    }
    return true;
}, {
    message: 'Este campo es requerido para el evento seleccionado.',
    // This is a generic message, we'll handle specific messages in the form.
    // We set a path, but it won't be used directly. The check is what matters.
    path: ['birthDate'], 
}).refine(data => {
    if (data.event === 'Violencia de Género') {
        return !!data.genderViolenceType && data.genderViolenceType.length > 0;
    }
    return true;
}, {
    message: 'El tipo de violencia es requerido.',
    path: ['genderViolenceType'],
}).refine(data => {
    if (data.event === 'Violencia de Género' && data.genderViolenceType === 'otros') {
        return !!data.genderViolenceTypeDetails && data.genderViolenceTypeDetails.length > 1;
    }
    return true;
}, {
    message: 'Especifique el tipo de violencia.',
    path: ['genderViolenceTypeDetails'],
});

export const userSchema = z.object({
  username: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." }),
  fullName: z.string().min(3, { message: "El nombre completo es requerido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }).optional().or(z.literal('')),
  cargo: z.string().min(2, { message: "El cargo es requerido." }),
  role: z.enum(['admin', 'user']),
  signature: z.string().optional(),
});
