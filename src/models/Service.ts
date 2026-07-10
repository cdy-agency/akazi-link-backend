import mongoose, { Schema, Types } from 'mongoose';

export interface IServiceDoc {
  categoryId: Types.ObjectId;
  slug: string;
  name: string;
  nameRw?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

const ServiceSchema = new Schema<IServiceDoc>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
      index: true,
    },
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameRw: { type: String, trim: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ServiceSchema.index({ categoryId: 1, slug: 1 }, { unique: true });
ServiceSchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 });

const Service = mongoose.model<IServiceDoc>('Service', ServiceSchema);
export default Service;
