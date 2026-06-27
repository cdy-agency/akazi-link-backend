import mongoose, { Schema, Types } from 'mongoose';
import { IApplication, IFileInfo, INotification } from '../types/models';

const FileInfoSchema = new Schema<IFileInfo>({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true }
});


const NotificationSchema: Schema = new Schema(
{
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
},
{ _id: true }
);

const ApplicationSchema: Schema = new Schema(
{
  jobId: { type: Types.ObjectId, ref: 'Job', required: true },
  employeeId: { type: Types.ObjectId, ref: 'Employee', required: true },
  cvId: { type: Types.ObjectId, ref: 'CvDocument' },
  resume:{type: String},
  skills: { type: [String], default: [] },
  experience: { type: String },
  coverLetter: { type: String },
  appliedVia: {
    type: String,
    enum: ['normal', 'whatsapp', 'referral'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: [
      'pending',
      'hired',
      'rejected',
      'PENDING',
      'REVIEWED',
      'APPLIED',
      'UNDER_REVIEW',
      'SHORTLISTED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_COMPLETED',
      'SELECTED',
      'OFFER_SENT',
      'REJECTED',
      'HIRED',
    ],
    default: 'APPLIED',
  },
  hiredAt: { type: Date },
  profileSnapshot: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    professionalSummary: String,
    skills: { type: [String], default: [] },
    interviewSkills: { type: [String], default: [] },
    education: { type: [String], default: [] },
    experience: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    linkedInUrl: String,
    githubUrl: String,
    portfolioUrl: String,
    yearsOfExperience: Number,
    capturedAt: { type: Date },
  },
  matchScore: { type: Number, index: true },
  matchBreakdown: {
    skills: {
      score: Number,
      weight: Number,
      matched: { type: [String], default: [] },
    },
    experience: {
      score: Number,
      weight: Number,
      matched: { type: [String], default: [] },
      details: String,
    },
    education: {
      score: Number,
      weight: Number,
      matched: { type: [String], default: [] },
    },
    languages: {
      score: Number,
      weight: Number,
      matched: { type: [String], default: [] },
    },
    certifications: {
      score: Number,
      weight: Number,
      matched: { type: [String], default: [] },
    },
  },
  notifications: { type: [NotificationSchema], default: [] },
},
{ timestamps: true }
);

const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
export default Application;
