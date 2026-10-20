import mongoose, { Document, Schema } from 'mongoose';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface IVerificationDoc {
  title: string;
  documentType: string;
  url: string;
  verifiedAt?: Date;
}

export interface ILawyer extends Document {
  _id: any;
  userId: string;
  barRegistrationNumber: string;
  barCouncilState: string;
  yearOfAdmission: number;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verificationDocuments: IVerificationDoc[];
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
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LawyerSchema = new Schema<ILawyer>(
  {
    userId: { type: String, required: true, ref: 'User', unique: true },
    barRegistrationNumber: { type: String, required: true, trim: true },
    barCouncilState: { type: String, required: true, trim: true },
    yearOfAdmission: { type: Number, required: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verificationNotes: { type: String },
    verificationDocuments: [
      {
        title: { type: String, required: true },
        documentType: { type: String, required: true },
        url: { type: String, required: true },
        verifiedAt: { type: Date },
      },
    ],
    practiceAreas: [{ type: String, trim: true }],
    primaryDomain: { type: String, required: true, trim: true },
    bio: { type: String, required: true, trim: true },
    education: { type: String, required: true, trim: true },
    experienceYears: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    consultationDurationMinutes: { type: Number, default: 45 },
    officeAddress: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    languages: [{ type: String, trim: true }],
    courtAdmissions: [{ type: String, trim: true }],
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isAcceptingNewClients: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

LawyerSchema.index({ userId: 1 }, { unique: true });
LawyerSchema.index({ barRegistrationNumber: 1 });
LawyerSchema.index({ verificationStatus: 1 });
LawyerSchema.index({ primaryDomain: 1 });
LawyerSchema.index({ city: 1 });
LawyerSchema.index({ rating: -1 });

export const LawyerModel = mongoose.models.Lawyer || mongoose.model<ILawyer>('Lawyer', LawyerSchema);
