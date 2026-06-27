import { IApplicationProfileSnapshot } from './profile-draft.types';

export interface ICandidateProfileForMatch {
  skills: string[];
  interviewSkills: string[];
  education: string[];
  experience: string[];
  languages: string[];
  certifications: string[];
  location?: string;
  yearsOfExperience?: number;
}

export interface IJobRequirementsForMatch {
  skills: string[];
  experience?: string;
  description?: string;
  province?: string;
  district?: string;
  category?: string;
}

export interface IMatchFactorResult {
  score: number;
  weight: number;
  matched: string[];
  details?: string;
}

export interface IMatchBreakdown {
  skills: IMatchFactorResult;
  experience: IMatchFactorResult;
  education: IMatchFactorResult;
  languages: IMatchFactorResult;
  certifications: IMatchFactorResult;
}

export interface IMatchResult {
  score: number;
  breakdown: IMatchBreakdown;
}

export type ProfileSnapshotForMatch = IApplicationProfileSnapshot;
