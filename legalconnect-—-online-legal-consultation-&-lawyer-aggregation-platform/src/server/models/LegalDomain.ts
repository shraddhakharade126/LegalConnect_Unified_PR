import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalDomain extends Document {
  _id: any;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const LegalDomainSchema = new Schema<ILegalDomain>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, default: 'Scale' },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

LegalDomainSchema.index({ slug: 1 }, { unique: true });
LegalDomainSchema.index({ isActive: 1 });

export const LegalDomainModel =
  mongoose.models.LegalDomain || mongoose.model<ILegalDomain>('LegalDomain', LegalDomainSchema);
