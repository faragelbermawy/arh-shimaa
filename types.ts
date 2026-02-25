export enum ModuleId {
  HAND_HYGIENE = 'hand-hygiene',
  PPE_PROTOCOLS = 'ppe-protocols',
  MDRO_BASICS = 'mdro-basics',
  EQUIPMENT_CLEANING = 'equipment-cleaning',
  PATIENT_TYPES = 'patient-types',
  VISITOR_EDUCATION = 'visitor-education',
  GENERAL_LEARNING = 'general-learning'
}

export type AuditType = 'hand-hygiene' | 'ppe-compliance' | 'environmental' | 'equipment' | 'isolation' | 'visitors' | 'education';

export interface Visitor {
  id: string;
  name: string;
  department: string;
  timestamp: string;
}

export interface GoldenFile {
  id: string;
  name: string;
  type: string;
  data: string;
  timestamp: string;
  size: string;
}

export interface ClinicalReport {
  id: string;
  title: string;
  unitName?: string;
  mdroTransmission?: string;
  reportDate?: string;
  timestamp: string;
  analysisDate?: string;
  extractedScores: {
    handHygiene: number;
    ppe: number;
    environmental: number;
    equipment: number;
  };
  summary: string;
  status?: 'pending' | 'analyzed' | 'error';
  totalScore?: number;
  isMdroFinding?: boolean;
  auditType?: AuditType | 'mdro-finding';
  checkedItems?: string[]; 
  staffGroup?: string; 
  auditor?: string; 
  audienceName?: string; 
  fileData?: string; // Base64 or DataURL
  fileMimeType?: string;
  isCloudRecord?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserProgress {
  completedModules: string[];
  quizScores: Record<string, number>;
  handWashStreak: number;
  lastHandWash: string;
  totalHandWashes: number;
  ppeDonningCount: number;
  ppeDoffingCount: number;
  managerPhone?: string;
}

export interface PPEStep {
  title: string;
  ar?: string;
  description: string;
  image?: string;
  icon?: any;
  color?: string;
}

export interface PPEProtocol {
  donning: PPEStep[];
  doffing: PPEStep[];
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  auditor: string;
  staffGroup: string;
  audienceName: string;
  department: string;
  handHygieneScore: number;
  ppeScore: number;
  environmentalScore: number;
  equipmentScore: number;
  totalScore: number;
  notes: string;
  actionTaken: string;
  auditType?: AuditType;
  checkedItems?: string[];
}