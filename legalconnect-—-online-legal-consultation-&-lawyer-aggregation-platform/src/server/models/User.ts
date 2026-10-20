import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'client' | 'lawyer' | 'admin';

export interface IUser extends Document {
  _id: any;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  city?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['client', 'lawyer', 'admin'],
      default: 'client',
      required: true,
    },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    avatar: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
