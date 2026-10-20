import mongoose, { Document, Schema } from 'mongoose';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type ConsultationType = 'video' | 'in_person' | 'phone';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface IAiBrief {
  summary: string;
  keyCategories?: string[];
  suggestedQuestions?: string[];
  recommendedDocuments?: string[];
  generatedAt: Date;
}

export interface IAppointment extends Document {
  _id: any;
  lawyerId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  lawyerName: string;
  lawyerEmail: string;
  legalDomainId: string;
  legalDomainName: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  consultationType: ConsultationType;
  fee: number;
  paymentStatus: PaymentStatus;
  issueSummary: string;
  clientQuestions: string[];
  aiBrief?: IAiBrief;
  meetingLink?: string;
  lawyerNotes?: string;
  actionItems?: string[];
  cancellationReason?: string;
  cancelledBy?: string;
  reviewedByClient?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const AppointmentSchema = new Schema<IAppointment>(
  {
    lawyerId: { type: String, required: true, ref: 'Lawyer' },
    clientId: { type: String, required: true, ref: 'User' },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    lawyerName: { type: String, required: true },
    lawyerEmail: { type: String, required: true },
    legalDomainId: { type: String, required: true },
    legalDomainName: { type: String, required: true },
    appointmentDate: { type: String, required: true }, // Format: YYYY-MM-DD
    startTime: { type: String, required: true }, // Format: HH:mm
    endTime: { type: String, required: true }, // Format: HH:mm
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
      default: 'requested',
    },
    consultationType: {
      type: String,
      enum: ['video', 'in_person', 'phone'],
      default: 'video',
    },
    fee: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'paid',
    },
    issueSummary: { type: String, required: true, trim: true },
    clientQuestions: [{ type: String }],
    aiBrief: {
      summary: { type: String },
      keyCategories: [{ type: String }],
      suggestedQuestions: [{ type: String }],
      recommendedDocuments: [{ type: String }],
      generatedAt: { type: Date },
    },
    meetingLink: { type: String },
    lawyerNotes: { type: String },
    actionItems: [{ type: String }],
    cancellationReason: { type: String },
    cancelledBy: { type: String },
    reviewedByClient: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find conflicts
AppointmentSchema.index({ lawyerId: 1, appointmentDate: 1, startTime: 1 });
AppointmentSchema.index({ clientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });

export const AppointmentModel =
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
