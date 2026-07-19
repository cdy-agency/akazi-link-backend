import mongoose, { Schema, Types } from 'mongoose';
import {
  ADVERTISEMENT_MEDIA_TYPES,
  ADVERTISEMENT_PLACEMENTS,
  ADVERTISEMENT_STATUSES,
  AdvertisementMediaType,
  AdvertisementPlacement,
  AdvertisementStatus,
} from '../config/advertisement.config';

export interface IAdvertisement {
  title: string;
  description?: string;
  mediaType: AdvertisementMediaType;
  mediaUrl: string;
  cloudinaryPublicId?: string;
  placement: AdvertisementPlacement | 'SIDEBAR' | 'HOMEPAGE';
  buttonText?: string;
  buttonLink?: string;
  startDate: Date;
  endDate: Date;
  status: AdvertisementStatus;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    mediaType: {
      type: String,
      enum: ADVERTISEMENT_MEDIA_TYPES,
      required: true,
    },
    mediaUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    placement: {
      type: String,
      // Legacy SIDEBAR / HOMEPAGE so old documents still load; service normalizes.
      enum: [...ADVERTISEMENT_PLACEMENTS, 'SIDEBAR', 'HOMEPAGE'],
      required: true,
    },
    buttonText: { type: String, trim: true },
    buttonLink: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ADVERTISEMENT_STATUSES,
      required: true,
      default: 'DRAFT',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AdvertisementSchema.index({ status: 1, placement: 1 });
AdvertisementSchema.index({ startDate: 1, endDate: 1 });
AdvertisementSchema.index({ title: 1 });

const Advertisement = mongoose.model<IAdvertisement>(
  'Advertisement',
  AdvertisementSchema
);

export default Advertisement;
