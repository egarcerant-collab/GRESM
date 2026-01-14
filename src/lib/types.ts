export type Audit = {
  id: string;
  auditorName: string;
  patientName: string;
  documentType: string;
  documentNumber: string;
  event: string;
  eventDetails: string;
  followUpDate: Date;
  visitType: 'PRIMERA VEZ' | 'Seguimiento' | 'CIERRE DE CASO';
  department: string;
  municipality: string;
  ethnicity: string;
  address: string;
  phoneNumber: string;
  followUpNotes: string;
  nextSteps: string;
  createdAt: Date;
};
