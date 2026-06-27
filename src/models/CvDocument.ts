import { Schema, model } from 'mongoose';
import { CV_PARSE_STATUSES } from '../config/cv.config';
import { ICvDocument } from '../types/cv.types';

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

const CvDocumentSchema = new Schema<ICvDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    parseStatus: {
      type: String,
      enum: CV_PARSE_STATUSES,
      default: 'NOT_STARTED',
    },
    rawText: { type: String },
    extractedData: { type: ExtractedDataSchema },
    confidenceScores: { type: ConfidenceScoresSchema },
    aiProvider: {
      type: String,
      enum: ['groq', 'anthropic', 'heuristic'],
    },
    extractionMethod: {
      type: String,
      enum: ['docx', 'doc', 'pdf', 'ocr'],
    },
    textExtractionDurationMs: { type: Number },
    structuredExtractionDurationMs: { type: Number },
    processedAt: { type: Date },
    parseError: { type: String },
    version: { type: Number, required: true },
    cloudinaryPublicId: { type: String },
  },
  { timestamps: true }
);

CvDocumentSchema.index({ employeeId: 1, version: -1 });

const CvDocument = model<ICvDocument>('CvDocument', CvDocumentSchema);
export default CvDocument;
