import mongoose, { Schema, Types } from 'mongoose';
import {
  INTERVIEW_RECOMMENDATIONS,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
} from '../config/pipeline.config';

export interface IInterviewFeedback {
  technicalScore?: number;
  communicationScore?: number;
  professionalismScore?: number;
  overallScore?: number;
  notes?: string;
  recommendation?: (typeof INTERVIEW_RECOMMENDATIONS)[number];
}

export interface IInterviewDoc {
  applicationId: Types.ObjectId;
  candidateId: Types.ObjectId;
  jobId: Types.ObjectId;
  scheduledDate: Date;
  meetingLink?: string;
  location?: string;
  interviewType: (typeof INTERVIEW_TYPES)[number];
  notes?: string;
  feedback?: IInterviewFeedback;
  score?: number;
  status: (typeof INTERVIEW_STATUSES)[number];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewFeedbackSchema = new Schema(
  {
    technicalScore: { type: Number, min: 0, max: 100 },
    communicationScore: { type: Number, min: 0, max: 100 },
    professionalismScore: { type: Number, min: 0, max: 100 },
    overallScore: { type: Number, min: 0, max: 100 },
    notes: String,
    recommendation: {
      type: String,
      enum: INTERVIEW_RECOMMENDATIONS,
    },
  },
  { _id: false }
);

const InterviewSchema: Schema = new Schema(
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
    scheduledDate: { type: Date, required: true },
    meetingLink: String,
    location: String,
    interviewType: {
      type: String,
      enum: INTERVIEW_TYPES,
      required: true,
    },
    notes: String,
    feedback: InterviewFeedbackSchema,
    score: Number,
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: 'SCHEDULED',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Interview = mongoose.model<IInterviewDoc>('Interview', InterviewSchema);
export default Interview;
