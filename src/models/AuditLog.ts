import mongoose, { Schema, Types } from 'mongoose';
import { AuditAction } from '../config/pipeline.config';

export interface IAuditLogDoc {
  actorId?: Types.ObjectId;
  actorRole?: 'superadmin' | 'employee' | 'company';
  action: AuditAction | string;
  entityType: 'Application' | 'Interview' | 'Offer';
  entityId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: {
      type: String,
      enum: ['superadmin', 'employee', 'company'],
    },
    action: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: ['Application', 'Interview', 'Offer'],
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AuditLog = mongoose.model<IAuditLogDoc>('AuditLog', AuditLogSchema);
export default AuditLog;
