import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailabilitySlot extends Document {
  _id: any;
  lawyerId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "17:00"
  slotDurationMinutes: number; // e.g. 45
  breakStartTime?: string; // e.g. "13:00"
  breakEndTime?: string; // e.g. "14:00"
  isAvailable: boolean;
  blockedDates: string[]; // e.g. ["2026-10-20"]
  createdAt: Date;
  updatedAt: Date;
}

export const AvailabilitySchema = new Schema<IAvailabilitySlot>(
  {
    lawyerId: { type: String, required: true, ref: 'Lawyer' },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, default: '09:00' },
    endTime: { type: String, required: true, default: '17:00' },
    slotDurationMinutes: { type: Number, required: true, default: 45 },
    breakStartTime: { type: String, default: '13:00' },
    breakEndTime: { type: String, default: '14:00' },
    isAvailable: { type: Boolean, default: true },
    blockedDates: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

AvailabilitySchema.index({ lawyerId: 1, dayOfWeek: 1 }, { unique: true });

export const AvailabilityModel =
  mongoose.models.Availability || mongoose.model<IAvailabilitySlot>('Availability', AvailabilitySchema);
