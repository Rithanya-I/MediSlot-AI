export type ScreenId =
  | 'overview'
  | 'triage'
  | 'specialists'
  | 'provider-detail'
  | 'booking'
  | 'confirmation'
  | 'appointments'
  | 'telehealth'
  | 'intake'
  | 'insurance'
  | 'messages'
  | 'clinic-schedule'
  | 'analytics';

export interface Specialist {
  id: number;
  slug: string;
  name: string;
  credentials: string;
  specialty: string;
  department: string;
  clinicLocation: string;
  bio: string;
  education: string;
  languages: string;
  yearsExperience: number;
  consultationMinutes: number;
  rating: string;
  acceptsTelehealth: boolean;
  avatarUrl: string | null;
  insurancesAccepted: string;
}

export interface ClinicSlot {
  id: number;
  specialistId: number;
  slotDate: string;
  slotTime: string;
  isAiRecommended: boolean;
  isBlocked: boolean;
  visitMode: string;
  isBooked: boolean;
}

export interface Appointment {
  id: number;
  referenceCode: string;
  userId: number;
  specialistId: number;
  slotDate: string;
  slotTime: string;
  visitType: string;
  status: string;
  reason: string;
  triageUrgency: string;
  prepNotes: string | null;
  vitalsPrecheck: string | null;
  checkInStatus: string;
  createdAt: string;
  specialistName?: string;
  specialistCredentials?: string;
  specialty?: string;
  clinicLocation?: string;
  avatarUrl?: string | null;
  consultationMinutes?: number;
}

export interface PatientProfile {
  id: number;
  userId: number;
  fullName: string;
  dateOfBirth: string;
  phone: string;
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceCarrier: string;
  insurancePlan: string;
  memberId: string;
  groupNumber: string;
  copayAmount: string;
  coverageStatus: string;
}

export interface TriageResult {
  recommendedSpecialty: string;
  urgencyLevel: 'Routine' | 'Priority' | 'Same-Day Urgent';
  aiSummary: string;
  prepChecklist: string[];
  recommendedSpecialistId: number;
  matchRationale: string;
}

export interface TriageRecord {
  id: number;
  symptoms: string;
  duration: string;
  severity: string;
  recommendedSpecialty: string;
  urgencyLevel: string;
  aiSummary: string;
  prepChecklist: string;
  createdAt: string;
}

export interface CareMessage {
  id: number;
  userId: number;
  specialistId: number | null;
  senderRole: 'patient' | 'clinic';
  senderName: string;
  body: string;
  createdAt: string;
}

export interface PredictiveMatchResult {
  slotId: number;
  specialistId: number;
  slotDate: string;
  slotTime: string;
  specialistName: string;
  specialty: string;
  headline: string;
  reason: string;
  recommendedVisitType: 'In-Person' | 'Telehealth';
}

export interface ClinicOpsData {
  specialists: Specialist[];
  totalSlots: number;
  blockedSlots: number;
  aiRecommendedSlots: number;
  appointments: Array<{
    id: number;
    referenceCode: string;
    specialistId: number;
    slotDate: string;
    slotTime: string;
    visitType: string;
    status: string;
    triageUrgency: string;
    checkInStatus: string;
    reason: string;
    specialistName: string;
    specialty: string;
  }>;
}
