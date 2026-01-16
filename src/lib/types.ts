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
  // Campos condicionales para eventos específicos
  birthDate?: Date;
  age?: number;
  sex?: 'Masculino' | 'Femenino';
  affiliationStatus?: string;
  area?: 'Rural' | 'Urbano';
  settlement?: string;
  nationality?: string;
  primaryHealthProvider?: string;
  regime?: 'Subsidiado' | 'Contributivo';
  upgdProvider?: string;
  followUpInterventionType?: string;
};

export type User = {
    username: string;
    fullName: string;
    password?: string;
    role: 'admin' | 'user';
    cargo: string;
    signature?: string; // As base64 data URL
};
