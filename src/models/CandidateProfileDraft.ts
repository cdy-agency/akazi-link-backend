import { Schema, model } from 'mongoose';
import { PROFILE_DRAFT_REVIEW_STATUSES } from '../config/cv-profile-review.config';
import { ICandidateProfileDraft } from '../types/profile-draft.types';

const ExtractedDataSchema = new Schema(
  {
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
    certificates: { type: [String], default: [] },
    linkedInUrl: String,
    githubUrl: String,
    portfolioUrl: String,
    yearsOfExperience: Number,
  },
  { _id: false }
);

const ConfidenceScoresSchema = new Schema(
  {
    fullName: Number,
    email: Number,
    phone: Number,
    location: Number,
    professionalSummary: Number,
    skills: Number,
    interviewSkills: Number,
    education: Number,
    experience: Number,
    languages: Number,
    certifications: Number,
    linkedInUrl: Number,
    githubUrl: Number,
    portfolioUrl: Number,
    yearsOfExperience: Number,
    overall: Number,
  },
  { _id: false }
);

const CandidateProfileDraftSchema = new Schema<ICandidateProfileDraft>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    cvId: {
      type: Schema.Types.ObjectId,
      ref: 'CvDocument',
      required: true,
    },
    extractedData: { type: ExtractedDataSchema, required: true },
    confidenceScores: { type: ConfidenceScoresSchema, default: {} },
    reviewStatus: {
      type: String,
      enum: PROFILE_DRAFT_REVIEW_STATUSES,
      default: 'REVIEW_REQUIRED',
    },
    profileStatus: {
      type: String,
      enum: ['DRAFT', 'REVIEW_REQUIRED', 'APPROVED'],
      default: 'REVIEW_REQUIRED',
      index: true,
    },
    extractedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

const CandidateProfileDraft = model<ICandidateProfileDraft>(
  'CandidateProfileDraft',
  CandidateProfileDraftSchema
);

export default CandidateProfileDraft;
