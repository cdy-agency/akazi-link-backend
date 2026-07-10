import mongoose, { Schema, Types } from 'mongoose';

export interface IProviderServiceDoc {
  providerId: Types.ObjectId;
  serviceId: Types.ObjectId;
}

const ProviderServiceSchema = new Schema<IProviderServiceDoc>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider',
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

ProviderServiceSchema.index({ providerId: 1, serviceId: 1 }, { unique: true });

const ProviderService = mongoose.model<IProviderServiceDoc>(
  'ProviderService',
  ProviderServiceSchema
);

export default ProviderService;
