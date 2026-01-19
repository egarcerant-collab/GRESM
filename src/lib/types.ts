
import type { User as FirebaseUser } from 'firebase/auth';

export type Audit = {
  id: string;
  auditorName: string;
  auditorId: string;
  patientName: string;
  documentType: string;
  documentNumber: string;
  event: string;
  eventDetails?: string;
  followUpDate: string; // ISO string
  visitType: 'PRIMERA VEZ' | 'Seguimiento' | 'CIERRE DE CASO';
  department: string;
  municipality: string;
  ethnicity: string;
  address: string;
  phoneNumber: string;
  followUpNotes: string;
  nextSteps: string;
  createdAt: string; // ISO string
  
  // Campos condicionales para eventos específicos
  birthDate?: string; // ISO string
  age?: number;
  sex?: 'Masculino' | 'Femenino';
  affiliationStatus?: 'Activa' | 'Inactiva';
  area?: 'Rural' | 'Urbano';
  settlement?: string;
  nationality?: string;
  primaryHealthProvider?: string;
  regime?: 'Subsidiado' | 'Contributivo';
  upgdProvider?: string;
  followUpInterventionType?: string;
  genderViolenceType?: string;
  genderViolenceTypeDetails?: string;
};

export type UserProfile = {
    uid: string;
    email: string;
    username: string;
    fullName: string;
    role: 'admin' | 'user';
    cargo: string;
    signature?: string; // As base64 data URL
};

// This type combines the Firebase user with our custom profile
export type AppUser = {
  firebaseUser: FirebaseUser;
  profile: UserProfile | null;
}
