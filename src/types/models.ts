import { Document, Types } from "mongoose";
import { JobStatus } from "../config/job.config";

// File interface for storing file information
export interface IFileInfo {
  url: string;
  public_id: string;
  format: string;
  size: number;
  name: string;
  type: string;
  time: string;
}

export interface ITeamMemberNumber {
  position: string;
  phoneNumber: string;
}


export interface IUser extends Document {
  email: string;
  image?: string;
  password?: string;
  provider: 'EMAIL' | 'GOOGLE' | 'LINKEDIN' 
  role: "employee" | "company" | "superadmin";
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailOtp extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export interface ICompany extends IUser {
  companyName: string;
  province?: string;
  district?: string;
  phoneNumber?: string;
  website?: string;
  logo?: IFileInfo; // Updated to store file info object
  isApproved: boolean;
  password: string;
  about?: string;
  documents?: IFileInfo[]; // Updated to store file info objects
  status: "pending" | "approved" | "rejected" | "disabled" | "deleted";
  rejectionReason?: string;
  disabledAt?: Date;
  deletedAt?: Date;
  profileCompletionStatus: "incomplete" | "complete" | "pending_review";
  profileCompletedAt?: Date;
  notifications?: INotification[];
  teamMembers?: ITeamMemberNumber[];
}

export interface IEmployee extends IUser {
  name: string;
  province?: string;
  district?: string;
  gender?: string;
  dateOfBirth?: Date;
  image?: string
  phoneNumber?: string;
  location?: string;
  jobPreferences?: string[];
  about?: string;
  experience?: string;
  education?: string;
  profileImage?: IFileInfo | string;
  skills?: string[];
  languages?: string[];
  certificates?: string[];
  documents?: (IFileInfo | string)[];
  primaryCvId?: Types.ObjectId | null;
  profileReviewStatus?: 'REVIEW_REQUIRED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  profileApprovedAt?: Date;
  profileReviewData?: {
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
    certificates?: string[];
    linkedInUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    yearsOfExperience?: number;
  };
  profileReviewCvId?: Types.ObjectId | null;
  profileStatus?: 'DRAFT' | 'REVIEW_REQUIRED' | 'APPROVED';
}

export interface IJob extends Document {
  title: string; 
  description: string;
  skills: string[];
  province: string,
  district: string,
  experience: string;
  employmentType: "fulltime" | "part-time" | "internship";
  category: string;
  salary: string,
  otherBenefits?: string[],
  responsibilities?: string[],
  benefits?: string[];
  companyId?: Types.ObjectId;
  status?: JobStatus;
  createdByAdminId?: Types.ObjectId;
  updatedByAdminId?: Types.ObjectId;
  applicationDeadline: string;
  applicationDeadlineAt?: Date;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  employeeId: Types.ObjectId;
  cvId?: Types.ObjectId;
  skills?: string[];
  experience?: string;
  resume?: string,
  coverLetter?: string,
  appliedVia: "normal" | "whatsapp" | "referral";
  status:
    | "pending"
    | "hired"
    | "rejected"
    | "PENDING"
    | "REVIEWED"
    | "APPLIED"
    | "UNDER_REVIEW"
    | "SHORTLISTED"
    | "INTERVIEW_SCHEDULED"
    | "INTERVIEW_COMPLETED"
    | "SELECTED"
    | "OFFER_SENT"
    | "REJECTED"
    | "HIRED";
  hiredAt?: Date;
  profileSnapshot?: {
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
    capturedAt?: Date;
  };
  matchScore?: number;
  matchBreakdown?: {
    skills: { score: number; weight: number; matched: string[] };
    experience: {
      score: number;
      weight: number;
      matched: string[];
      details?: string;
    };
    education: { score: number; weight: number; matched: string[] };
    languages: { score: number; weight: number; matched: string[] };
    certifications: { score: number; weight: number; matched: string[] };
  };
  notifications: INotification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkRequest extends Document {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  notifications: INotification[];
  createdAt: Date;
  updatedAt: Date;
}

// Location interface for consistent location structure
export interface ILocation {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

// Employer interface for household employers
export interface IEmployer extends Document {
  name: string;
  email?: string;
  phoneNumber: string;
  nationalId: string;
  location: ILocation;
  villageLeaderNumber: string;
  partnerNumber: string;
  married:  string,
  familyMembers: string,
  allTasks: string[]
  electricity: string,
  water: string,
  vocationDays: string,
  churchName: string;
  salary: number,
  profileImage?: IFileInfo;
  status: "pending" | "active" | "completed";
  selectedHousekeepers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Housekeeper interface
export interface IHousekeeper extends Document {
  fullName: string;
  dateOfBirth: Date;
  gender: "male" | "female";
  idNumber: string;
  phoneNumber: string;
  location: ILocation;
  workPreferences: {
    language: string,
    amountOfMoney: string,
    workType: string,
    vocationDays: string,
    married: string,
    numberChildren: string,
    willingToWorkWithChildren: boolean;
  };
  background: {
    hasParents: boolean;
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
    hasStudied: boolean;
    educationLevel?: string;
    church?: string;
  };
  passportImage?: IFileInfo;
  fullBodyImage?: IFileInfo;
  idImage?: IFileInfo,
  status: "available" | "hired" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface IPublicFlyer {
  title: string;
  description: string;
  image: IFileInfo;
  url: string;
  from: string;
  end: string;
  likes: string[];
  comments: {
   userId: Types.ObjectId | IUser;
  comment: string;
  createdAt: Date;
  replies?: {
     userId: Types.ObjectId | IUser;
    comment: string;
    createdAt: Date;
  }[];
}[]
  createdAt: Date;
  updatedAt: Date;
}