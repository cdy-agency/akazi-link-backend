import mongoose, { Schema, Types } from 'mongoose';

/**
 * Dedupes advertisement view events so one client does not inflate
 * viewCount by refreshing. Documents expire via TTL index.
 */
export interface IAdvertisementViewEvent {
  advertisementId: Types.ObjectId;
  viewerKey: string;
  createdAt: Date;
  expiresAt: Date;
}

const AdvertisementViewEventSchema = new Schema<IAdvertisementViewEvent>(
  {
    advertisementId: {
      type: Schema.Types.ObjectId,
      ref: 'Advertisement',
      required: true,
      index: true,
    },
    viewerKey: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AdvertisementViewEventSchema.index(
  { advertisementId: 1, viewerKey: 1 },
  { unique: true }
);
AdvertisementViewEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdvertisementViewEvent = mongoose.model<IAdvertisementViewEvent>(
  'AdvertisementViewEvent',
  AdvertisementViewEventSchema
);
