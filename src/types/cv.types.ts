import { Document, Types } from 'mongoose';

import { CvParseStatus } from '../config/cv.config';

import { CvAiProvider } from '../ai/cv-ai.service';



export type CvExtractionMethod = 'docx' | 'doc' | 'pdf' | 'ocr';



export interface ICvExtractedData {

  fullName?: string;

  email?: string;

  phone?: string;

  location?: string;

  skills: string[];

  education: string[];

  experience: string[];

  languages: string[];

  certificates: string[];

}



export interface ICvAiExtractedData extends ICvExtractedData {

  professionalSummary?: string;

  interviewSkills: string[];

  certifications: string[];

  linkedInUrl?: string;

  githubUrl?: string;

  portfolioUrl?: string;

  yearsOfExperience?: number;

}



export interface ICvConfidenceScores {

  fullName?: number;

  email?: number;

  phone?: number;

  location?: number;

  professionalSummary?: number;

  skills?: number;

  interviewSkills?: number;

  education?: number;

  experience?: number;

  languages?: number;

  certifications?: number;

  linkedInUrl?: number;

  githubUrl?: number;

  portfolioUrl?: number;

  yearsOfExperience?: number;

  overall?: number;

}



export const EMPTY_CV_EXTRACTED_DATA = (): ICvExtractedData => ({

  skills: [],

  education: [],

  experience: [],

  languages: [],

  certificates: [],

});



export const EMPTY_CV_AI_EXTRACTED_DATA = (): ICvAiExtractedData => ({

  skills: [],

  interviewSkills: [],

  education: [],

  experience: [],

  languages: [],

  certificates: [],

  certifications: [],

});



export interface ICvTextExtractionResult {

  rawText: string;

  extractionMethod: CvExtractionMethod;

  textExtractionDurationMs: number;

}



export interface ICvExtractionResult extends ICvTextExtractionResult {

  extractedData: ICvAiExtractedData;

  confidenceScores: ICvConfidenceScores;

  aiProvider?: CvAiProvider;

  structuredExtractionDurationMs: number;

}



export interface ICvExtractionSummary {

  skillsCount: number;

  educationCount: number;

  experienceCount: number;

  languagesCount: number;

  certificatesCount: number;

  interviewSkillsCount: number;

  fullName?: string;

  email?: string;

  phone?: string;

  location?: string;

  yearsOfExperience?: number;

}



export interface ICvDocument extends Document {

  employeeId: Types.ObjectId;

  fileName: string;

  fileUrl: string;

  fileSize: number;

  mimeType: string;

  uploadedAt: Date;

  parseStatus: CvParseStatus;

  rawText?: string;

  extractedData?: ICvAiExtractedData;

  confidenceScores?: ICvConfidenceScores;

  aiProvider?: CvAiProvider;

  extractionMethod?: CvExtractionMethod;

  textExtractionDurationMs?: number;

  structuredExtractionDurationMs?: number;

  processedAt?: Date;

  parseError?: string;

  version: number;

  cloudinaryPublicId?: string;

  createdAt: Date;

  updatedAt: Date;

}


