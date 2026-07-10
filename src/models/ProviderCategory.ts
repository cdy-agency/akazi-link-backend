import mongoose, { Schema, Types } from 'mongoose';

export interface IProviderCategoryDoc {
  providerId: Types.ObjectId;
  categoryId: Types.ObjectId;
}

const ProviderCategorySchema = new Schema<IProviderCategoryDoc>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

ProviderCategorySchema.index({ providerId: 1, categoryId: 1 }, { unique: true });

const ProviderCategory = mongoose.model<IProviderCategoryDoc>(
  'ProviderCategory',
  ProviderCategorySchema
);

export default ProviderCategory;
