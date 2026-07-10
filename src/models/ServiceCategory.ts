import mongoose, { Schema } from 'mongoose';

export interface IServiceCategoryDoc {
  slug: string;
  name: string;
  nameRw?: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

const ServiceCategorySchema = new Schema<IServiceCategoryDoc>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    nameRw: { type: String, trim: true },
    description: { type: String },
    icon: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ServiceCategorySchema.index({ isActive: 1, sortOrder: 1 });

const ServiceCategory = mongoose.model<IServiceCategoryDoc>(
  'ServiceCategory',
  ServiceCategorySchema
);

export default ServiceCategory;
