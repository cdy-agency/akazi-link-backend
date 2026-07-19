import mongoose, { Schema } from 'mongoose';
import { IServiceRequest } from '../types/models';
import {
  PREFERRED_CONTACT_METHODS,
  SERVICE_REQUEST_STATUSES,
} from '../config/marketplace.config';
import { FileInfoSchema } from './shared/FileInfoSchema';

const StatusHistorySchema = new Schema(
  {
    status: { type: String, enum: SERVICE_REQUEST_STATUSES, required: true },
    note: { type: String },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedByRole: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerWhatsapp: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    preferredContactMethod: {
      type: String,
      enum: PREFERRED_CONTACT_METHODS,
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    preferredDate: { type: Date },
    province: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    cell: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    attachments: { type: [FileInfoSchema], default: [] },
    status: {
      type: String,
      enum: SERVICE_REQUEST_STATUSES,
      default: 'NEW',
      index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

ServiceRequestSchema.index({ providerId: 1, status: 1, createdAt: -1 });
ServiceRequestSchema.index({ status: 1, createdAt: -1 });

const ServiceRequest = mongoose.model<IServiceRequest>(
  'ServiceRequest',
  ServiceRequestSchema
);

export default ServiceRequest;
