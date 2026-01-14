import { z } from 'zod';

export const auditSchema = z.object({
  auditorName: z.string().min(2, { message: 'El nombre del auditor es requerido.' }),
  patientName: z.string().min(2, { message: 'El nombre del paciente es requerido.' }),
  documentType: z.string({ required_error: 'Seleccione un tipo de documento.' }).min(1, { message: 'Seleccione un tipo de documento.' }),
  documentNumber: z.string().min(5, { message: 'El número de documento es requerido.' }),
  event: z.string({ required_error: 'Seleccione un evento.' }).min(1, { message: 'Seleccione un evento.' }),
  eventDetails: z.string().min(2, { message: 'Especifique el evento.' }),
  followUpDate: z.date({ required_error: 'La fecha de seguimiento es requerida.' }),
  visitType: z.enum(['PRIMERA VEZ', 'Seguimiento'], { required_error: 'Seleccione el tipo de visita.' }),
  department: z.string().min(2, { message: 'El departamento es requerido.' }),
  municipality: z.string().min(2, { message: 'El municipio es requerido.' }),
  ethnicity: z.string().min(2, { message: 'La etnia es requerida.' }),
  address: z.string().min(5, { message: 'La dirección es requerida.' }),
  phoneNumber: z.string().min(7, { message: 'El número de teléfono es requerido.' }),
  followUpNotes: z.string().min(10, { message: 'Las notas de seguimiento son requeridas.' }),
  nextSteps: z.string().min(10, { message: 'La conducta a seguir es requerida.' }),
});
