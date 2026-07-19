import mongoose, { Schema } from 'mongoose';
import { IServiceProvider } from '../types/models';
import User from './User';
import {
  AVAILABILITY_STATUSES,
  PRICING_MODELS,
  PROVIDER_STATUSES,
  PROVIDER_TYPES,
} from '../config/marketplace.config';
import { BusinessHoursSchema, FileInfoSchema } from './shared/FileInfoSchema';

const ServiceProviderSchema = new Schema<IServiceProvider>(
  {
    providerType: { type: String, enum: PROVIDER_TYPES, required: true },
    displayName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    password: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: true },
    description: { type: String },
    yearsOfExperience: { type: Number, min: 0 },
    languages: { type: [String], default: [] },
    businessHours: { type: [BusinessHoursSchema], default: [] },
    tin: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    sector: { type: String },
    address: { type: String },
    logo: { type: FileInfoSchema, required: true },
    gallery: { type: [FileInfoSchema], default: [] },
    portfolioImages: { type: [FileInfoSchema], default: [] },
    certificates: { type: [FileInfoSchema], default: [] },
    status: {
      type: String,
      enum: PROVIDER_STATUSES,
      default: 'PENDING',
      index: true,
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pricingModel: { type: String, enum: PRICING_MODELS, default: 'NEGOTIABLE' },
    pricingNotes: { type: String },
    availabilityStatus: {
      type: String,
      enum: AVAILABILITY_STATUSES,
      default: 'AVAILABLE',
    },
    availabilityNotes: { type: String },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

ServiceProviderSchema.index({ province: 1, district: 1 });
ServiceProviderSchema.index({ averageRating: -1 });
ServiceProviderSchema.index({ displayName: 'text', description: 'text' });

const ServiceProvider = User.discriminator<IServiceProvider>(
  'ServiceProvider',
  ServiceProviderSchema
);

export default ServiceProvider;
