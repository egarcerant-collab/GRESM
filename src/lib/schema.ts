import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string()
    .min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." })
    .regex(/^[a-zA-Z0-9_.-]+$/, { message: "Nombre de usuario inválido. Use solo letras, números, puntos, guiones y guiones bajos." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
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
  otherDepartment: z.string().optional(),
  municipality: z.string().min(2, { message: 'El municipio es requerido.' }),
  ethnicity: z.string().min(2, { message: 'La etnia es requerida.' }),
  otherEthnicity: z.string().optional(),
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
}).superRefine((data, ctx) => {
    const specialEvent = data.event === 'Intento de Suicidio' || data.event === 'Consumo de Sustancia Psicoactivas';
    if (specialEvent) {
        if (!data.birthDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de nacimiento es requerida.', path: ['birthDate'] });
        }
        if (data.age === undefined) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La edad es requerida.', path: ['age'] });
        }
        if (!data.sex) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El sexo es requerido.', path: ['sex'] });
        }
        if (!data.affiliationStatus) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El estado de afiliación es requerido.', path: ['affiliationStatus'] });
        }
        if (!data.area) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El área es requerida.', path: ['area'] });
        }
        if (!data.settlement || data.settlement.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El asentamiento es requerido.', path: ['settlement'] });
        }
        if (!data.nationality || data.nationality.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La nacionalidad es requerida.', path: ['nationality'] });
        }
        if (!data.primaryHealthProvider || data.primaryHealthProvider.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La IPS Atención Primaria es requerida.', path: ['primaryHealthProvider'] });
        }
        if (!data.regime) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El régimen es requerido.', path: ['regime'] });
        }
        if (!data.upgdProvider || data.upgdProvider.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El nombre UPGD es requerido.', path: ['upgdProvider'] });
        }
        if (!data.followUpInterventionType || data.followUpInterventionType.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El tipo de intervención es requerido.', path: ['followUpInterventionType'] });
        }
    }
    
    if (data.department === 'OTRO' && (!data.otherDepartment || data.otherDepartment.length < 2)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Especifique el departamento.', path: ['otherDepartment'] });
    }
    
    if (data.ethnicity === 'OTRO' && (!data.otherEthnicity || data.otherEthnicity.length < 2)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Especifique la etnia.', path: ['otherEthnicity'] });
    }
});

export const userSchema = z.object({
  username: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." }),
  fullName: z.string().min(3, { message: "El nombre completo es requerido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }).optional().or(z.literal('')),
  cargo: z.string().min(2, { message: "El cargo es requerido." }),
  role: z.enum(['admin', 'user']),
  signature: z.string().optional(),
});