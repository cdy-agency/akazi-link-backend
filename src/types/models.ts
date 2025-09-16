import { Document, Types } from "mongoose";

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

export interface IUser extends Document {
  email: string;
  image?: string;
  password?: string;
  role: "employee" | "company" | "superadmin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompany extends IUser {
  companyName: string;
  location?: string;
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
}

export interface IEmployee extends IUser {
  name: string;
  dateOfBirth?: Date;
  image?: string
  phoneNumber?: string;
  jobPreferences?: string[];
  about?: string;
  experience?: string;
  education?: string;
  profileImage?: IFileInfo | string;
  skills?: string[];
  documents?: (IFileInfo | string)[];
}

export interface IJob extends Document {
  title: string; 
  description: string;
  skills: string[];
  location: string,
  image: IFileInfo;
  experience: string;
  employmentType: "fulltime" | "part-time" | "internship";
    category: string;
  salaryMin: string,
  salaryMax: string,
  responsibilities?: string[],
  benefits?: string[];
  companyId: Types.ObjectId;
  applicationDeadline: string;
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
  skills?: string[];
  experience?: string;
  resume?: string,
  coverLetter?: string,
  appliedVia: "normal" | "whatsapp" | "referral";
  status: "pending" | "reviewed" | "interview" | "hired" | "rejected";
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
