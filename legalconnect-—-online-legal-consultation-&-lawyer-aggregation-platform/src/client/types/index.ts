export type UserRole = 'client' | 'lawyer' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface VerificationDoc {
  title: string;
  documentType: string;
  url: string;
  verifiedAt?: string;
}

export interface Lawyer {
  _id: string;
  userId: string;
  name?: string;
  avatar?: string;
  email?: string;
  barRegistrationNumber: string;
  barCouncilState: string;
  yearOfAdmission: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  verificationDocuments: VerificationDoc[];
  practiceAreas: string[];
  primaryDomain: string;
  bio: string;
  education: string;
  experienceYears: number;
  consultationFee: number;
  consultationDurationMinutes: number;
  officeAddress?: string;
  city: string;
  state: string;
  languages: string[];
  courtAdmissions: string[];
  rating: number;
  reviewCount: number;
  isAcceptingNewClients: boolean;
  isDemo?: boolean;
}

export interface LegalDomain {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isPopular: boolean;
  isActive: boolean;
}

export interface AvailabilitySlot {
  _id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  breakStartTime?: string;
  breakEndTime?: string;
  isAvailable: boolean;
  blockedDates?: string[];
}

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type ConsultationType = 'video' | 'in_person' | 'phone';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Appointment {
  _id: string;
  lawyerId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  lawyerName: string;
  lawyerEmail: string;
  legalDomainId: string;
  legalDomainName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  consultationType: ConsultationType;
  fee: number;
  paymentStatus: PaymentStatus;
  issueSummary: string;
  clientQuestions: string[];
  aiBrief?: {
    summary: string;
    keyCategories?: string[];
    suggestedQuestions?: string[];
    recommendedDocuments?: string[];
  };
  meetingLink?: string;
  lawyerNotes?: string;
  actionItems?: string[];
  cancellationReason?: string;
  cancelledBy?: string;
  reviewedByClient?: boolean;
  createdAt: string;
}

export interface ConsultationMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'lawyer' | 'admin';
  content: string;
  timestamp: number;
  read?: boolean;
}

export type DocumentType =
  | 'case_file'
  | 'agreement'
  | 'notice'
  | 'verification_id'
  | 'bar_license'
  | 'evidence'
  | 'client_brief';

export type ConfidentialityLevel = 'confidential' | 'lawyer_client_only' | 'admin_only';

export interface LegalDocument {
  _id: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  fileType: string;
  fileSize: number;
  fileData?: string;
  confidentialityLevel: ConfidentialityLevel;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByRole: string;
  relatedAppointmentId?: string;
  relatedLawyerId?: string;
  relatedClientId?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  consultationId: string;
  lawyerId: string;
  clientId: string;
  clientName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedConsultation: boolean;
  lawyerReply?: string;
  lawyerRepliedAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetResource: string;
  targetId?: string;
  ipAddress?: string;
  details?: any;
  createdAt: string;
}

export interface PlatformMetrics {
  totalClients: number;
  totalLawyers: number;
  verifiedLawyers: number;
  pendingLawyers: number;
  totalConsultations: number;
  completedConsultations: number;
  upcomingConsultations: number;
  totalVolume: number;
  avgRating: number;
  totalReviews: number;
}
