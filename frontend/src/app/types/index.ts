export type UserRole = 'admin' | 'coordinator' | 'technician';

export type CaseStatus = 'assigned' | 'observation' | 'execution' | 'completed';

export interface User {
  id: string;
  identificationType: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalEmail: string;
  institutionalEmail: string;
  username: string;
  role: UserRole;
  rolNombre: string;
  status: 'active' | 'inactive';
  accessibleModules: string[];
  // { "Directorio de Usuarios": ["Consultar", "Agregar"], ... }
  permisosDetalle: Record<string, string[]>;
  createdAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: CaseStatus;
  queue: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseObservation {
  id: string;
  caseId: string;
  userId: string;
  username: string;
  comment: string;
  sentByEmail: boolean;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  identificationType: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalEmail: string;
  institutionalEmail: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Log {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'login' | 'access_request' | 'user_management' | 'case_management';
}

export interface DashboardStats {
  activeUsers: number;
  inactiveUsers: number;
  assignedCases: number;
  observationCases: number;
  executionCases: number;
  completedCases: number;
}
