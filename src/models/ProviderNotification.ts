import mongoose, { Schema, Types } from 'mongoose';

export interface IProviderNotificationDoc {
  providerId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ProviderNotificationSchema = new Schema<IProviderNotificationDoc>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider',
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProviderNotificationSchema.index({ providerId: 1, read: 1, createdAt: -1 });

const ProviderNotification = mongoose.model<IProviderNotificationDoc>(
  'ProviderNotification',
  ProviderNotificationSchema
);

export default ProviderNotification;
