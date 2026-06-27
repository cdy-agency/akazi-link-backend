import { Types } from 'mongoose';
import AuditLog from '../models/AuditLog';
import { AuditAction } from '../config/pipeline.config';

export const logAudit = async ({
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorId?: string | Types.ObjectId;
  actorRole?: 'superadmin' | 'employee' | 'company';
  action: AuditAction | string;
  entityType: 'Application' | 'Interview' | 'Offer';
  entityId: string | Types.ObjectId;
  metadata?: Record<string, unknown>;
}) => {
  try {
    await AuditLog.create({
      actorId: actorId ? new Types.ObjectId(String(actorId)) : undefined,
      actorRole,
      action,
      entityType,
      entityId: new Types.ObjectId(String(entityId)),
      metadata,
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
};
