import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_rejected'
  | 'verification_update'
  | 'document_shared'
  | 'review_received'
  | 'consultation_reminder'
  | 'system';

export interface INotification extends Document {
  _id: any;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: String, required: true, ref: 'User' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'booking_request',
        'booking_confirmed',
        'booking_cancelled',
        'booking_rejected',
        'verification_update',
        'document_shared',
        'review_received',
        'consultation_reminder',
        'system',
      ],
      required: true,
    },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, read: 1 });

export const NotificationModel =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
