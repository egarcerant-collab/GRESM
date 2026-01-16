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
  genderViolenceType?: string;
  genderViolenceTypeDetails?: string;
};

export type User = {
    username: string;
    fullName: string;
    password?: string;
    role: 'admin' | 'user';
    cargo: string;
    signature?: string; // As base64 data URL
};

export type KpiResults = {
  kpiResult: number | null;
  gestantesControlResult: number | null;
  controlPercentageResult: number | null;
  examenesVihCompletosResult: number | null;
  resultadoTamizajeVihResult: number | null;
  examenesSifilisCompletosResult: number | null;
  resultadoTamizajeSifilisResult: number | null;
  toxoplasmaValidosResult: number | null;
  resultadoToxoplasmaResult: number | null;
  examenesHbCompletosResult: number | null;
  resultadoTamizajeHbResult: number | null;
  chagasResultadosValidosResult: number | null;
  resultadoChagasResult: number | null;
  ecografiasValidasResult: number | null;
  resultadoEcografiasResult: number | null;
  nutricionResult: number | null;
  resultadoNutricionResult: number | null;
  odontologiaResult: number | null;
  resultadoOdontologiaResult: number | null;
  ginecologiaResult: number | null;
  denominadorGinecologiaResult: number | null;
  porcentajeGinecologiaResult: number | null;
  controlesEnMes?: number | null;
  controlesFueraMes?: number | null;
  resultadoSinControlMes?: number | null;
  controlesPrenatalesAdecuados?: number | null;
  totalGestantesEgMayor32?: number | null;
  porcentajeControlesAdecuados?: number | null;
};

export type InformeDatos = {
  encabezado: {
    proceso: string;
    formato: string;
    entidad: string;
    vigencia: string;
    lugarFecha: string;
  };
  referencia: string;
  analisisResumido: string[];
  datosAExtraer: { label: string; valor: string }[];
  analisisAnual?: string;
  hallazgosCalidad: string[];
  recomendaciones: string[];
  observaciones: string[];
  inasistentes?: any[];
  firma?: {
    nombre: string;
    cargo: string;
    imagen?: string;
  };
};

export type DocImages = {
  background?: ArrayBuffer;
  charts?: { id: string; dataUrl: string }[];
};

export type MapData = {
    department: string;
    [key: string]: number | string;
};
