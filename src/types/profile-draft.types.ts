import { Document, Types } from 'mongoose';
import { ProfileDraftReviewStatus } from '../config/cv-profile-review.config';
import { ProfileStatus } from '../config/profile-status.config';
import { ICvAiExtractedData, ICvConfidenceScores } from './cv.types';

export interface ICandidateProfileDraft extends Document {
  employeeId: Types.ObjectId;
  cvId: Types.ObjectId;
  extractedData: ICvAiExtractedData;
  confidenceScores: ICvConfidenceScores;
  reviewStatus: ProfileDraftReviewStatus;
  profileStatus: ProfileStatus;
  extractedAt: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApplicationProfileSnapshot {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  professionalSummary?: string;
  skills?: string[];
  interviewSkills?: string[];
  education?: string[];
  experience?: string[];
  languages?: string[];
  certifications?: string[];
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  capturedAt: Date;
}
