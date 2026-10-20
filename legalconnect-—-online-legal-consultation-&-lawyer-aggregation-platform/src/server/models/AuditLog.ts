import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  _id: any;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetResource: string;
  targetId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

export const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    targetResource: { type: String, required: true },
    targetId: { type: String },
    ipAddress: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
