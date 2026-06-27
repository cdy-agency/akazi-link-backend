import mongoose, { Schema, Types } from 'mongoose';
import { OFFER_STATUSES } from '../config/pipeline.config';

export interface IOfferDoc {
  applicationId: Types.ObjectId;
  candidateId: Types.ObjectId;
  jobId: Types.ObjectId;
  offerStatus: (typeof OFFER_STATUSES)[number];
  offerLetter?: string;
  salary?: string;
  startDate?: Date;
  notes?: string;
  sentAt?: Date;
  respondedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema: Schema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    offerStatus: {
      type: String,
      enum: OFFER_STATUSES,
      default: 'DRAFT',
      index: true,
    },
    offerLetter: String,
    salary: String,
    startDate: Date,
    notes: String,
    sentAt: Date,
    respondedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Offer = mongoose.model<IOfferDoc>('Offer', OfferSchema);
export default Offer;
