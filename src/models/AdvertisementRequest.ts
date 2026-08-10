import mongoose, { Schema, Document } from 'mongoose';
import { ADVERTISEMENT_MEDIA_TYPES } from '../config/advertisement.config';

export const ADVERTISEMENT_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export type AdvertisementRequestStatus =
  (typeof ADVERTISEMENT_REQUEST_STATUSES)[number];

export const ADVERTISEMENT_REQUEST_PACKAGES = ['FREE', 'PREMIUM'] as const;
export type AdvertisementRequestPackage =
  (typeof ADVERTISEMENT_REQUEST_PACKAGES)[number];

export interface IAdvertisementRequest extends Document {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  /** Optional link when the ad is clicked. */
  linkUrl?: string;
  /** @deprecated User no longer selects placement; kept for older records. */
  placements: string[];
  message: string;
  packageType: AdvertisementRequestPackage;
  mediaUrl?: string;
  cloudinaryPublicId?: string;
  mediaType?: (typeof ADVERTISEMENT_MEDIA_TYPES)[number];
  status: AdvertisementRequestStatus;
  adminNote?: string;
  /** Schedule set by admin on approval. */
  startDate?: Date;
  endDate?: Date;
  /** Placement chosen by admin on approval. */
  placement?: string;
  /** Created Advertisement id when approved & published. */
  advertisementId?: mongoose.Types.ObjectId;
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
    linkUrl: { type: String, trim: true },
    placements: {
      type: [String],
      default: [],
    },
    message: { type: String, required: true, trim: true },
    packageType: {
      type: String,
      enum: ADVERTISEMENT_REQUEST_PACKAGES,
      default: 'FREE',
      index: true,
    },
    mediaUrl: { type: String, trim: true },
    cloudinaryPublicId: { type: String, trim: true },
    mediaType: {
      type: String,
      enum: ADVERTISEMENT_MEDIA_TYPES,
    },
    status: {
      type: String,
      enum: ADVERTISEMENT_REQUEST_STATUSES,
      default: 'PENDING',
      index: true,
    },
    adminNote: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    placement: { type: String, trim: true },
    advertisementId: {
      type: Schema.Types.ObjectId,
      ref: 'Advertisement',
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const AdvertisementRequestModel = mongoose.model<IAdvertisementRequest>(
  'AdvertisementRequest',
  AdvertisementRequestSchema
);
