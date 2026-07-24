import mongoose, { Schema, Document } from 'mongoose';
import { ADVERTISEMENT_PLACEMENTS } from '../config/advertisement.config';

export const ADVERTISEMENT_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export type AdvertisementRequestStatus =
  (typeof ADVERTISEMENT_REQUEST_STATUSES)[number];

export interface IAdvertisementRequest extends Document {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  placements: string[];
  message: string;
  status: AdvertisementRequestStatus;
  adminNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementRequestSchema = new Schema<IAdvertisementRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    placements: {
      type: [String],
      required: true,
      validate: {
        validator: (vals: string[]) =>
          vals.length > 0 &&
          vals.every((v) =>
            (ADVERTISEMENT_PLACEMENTS as readonly string[]).includes(v)
          ),
        message: 'Invalid placement selection',
      },
    },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ADVERTISEMENT_REQUEST_STATUSES,
      default: 'PENDING',
      index: true,
    },
    adminNote: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const AdvertisementRequestModel = mongoose.model<IAdvertisementRequest>(
  'AdvertisementRequest',
  AdvertisementRequestSchema
);
