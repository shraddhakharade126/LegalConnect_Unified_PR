import mongoose, { Document, Schema } from 'mongoose';

export type DocumentType =
  | 'case_file'
  | 'agreement'
  | 'notice'
  | 'verification_id'
  | 'bar_license'
  | 'evidence'
  | 'client_brief';

export type ConfidentialityLevel = 'confidential' | 'lawyer_client_only' | 'admin_only';

export interface ILegalDocument extends Document {
  _id: any;
  title: string;
  description?: string;
  documentType: DocumentType;
  fileType: string;
  fileSize: number; // in bytes
  fileData?: string; // base64 or secure stored string
  confidentialityLevel: ConfidentialityLevel;
  uploadedBy: string; // userId
  uploadedByName: string;
  uploadedByRole: string;
  relatedAppointmentId?: string;
  relatedLawyerId?: string;
  relatedClientId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DocumentSchema = new Schema<ILegalDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    documentType: {
      type: String,
      enum: ['case_file', 'agreement', 'notice', 'verification_id', 'bar_license', 'evidence', 'client_brief'],
      required: true,
    },
    fileType: { type: String, required: true, default: 'application/pdf' },
    fileSize: { type: Number, required: true },
    fileData: { type: String },
    confidentialityLevel: {
      type: String,
      enum: ['confidential', 'lawyer_client_only', 'admin_only'],
      default: 'lawyer_client_only',
    },
    uploadedBy: { type: String, required: true, ref: 'User' },
    uploadedByName: { type: String, required: true },
    uploadedByRole: { type: String, required: true },
    relatedAppointmentId: { type: String, ref: 'Appointment' },
    relatedLawyerId: { type: String, ref: 'Lawyer' },
    relatedClientId: { type: String, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ uploadedBy: 1 });
DocumentSchema.index({ relatedAppointmentId: 1 });
DocumentSchema.index({ relatedLawyerId: 1 });
DocumentSchema.index({ relatedClientId: 1 });

export const DocumentModel =
  mongoose.models.LegalDocument || mongoose.model<ILegalDocument>('LegalDocument', DocumentSchema);
