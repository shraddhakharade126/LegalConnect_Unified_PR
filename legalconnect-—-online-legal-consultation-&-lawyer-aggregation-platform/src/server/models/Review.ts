import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: any;
  consultationId: string;
  lawyerId: string;
  clientId: string;
  clientName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  isVerifiedConsultation: boolean;
  lawyerReply?: string;
  lawyerRepliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = new Schema<IReview>(
  {
    consultationId: { type: String, required: true, ref: 'Appointment', unique: true },
    lawyerId: { type: String, required: true, ref: 'Lawyer' },
    clientId: { type: String, required: true, ref: 'User' },
    clientName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    isVerifiedConsultation: { type: Boolean, default: true },
    lawyerReply: { type: String, trim: true },
    lawyerRepliedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ lawyerId: 1, createdAt: -1 });
ReviewSchema.index({ consultationId: 1 }, { unique: true });

export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
