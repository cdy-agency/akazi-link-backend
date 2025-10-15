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

export interface ITeamMemberNumber {
  position: string;
  phoneNumber: string;
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
  province: string,
  district: string,
  image: IFileInfo;
  experience: string;
  employmentType: "fulltime" | "part-time" | "internship";
  category: string;
  salary: string,
  otherBenefits?: string[],
  responsibilities?: string[],
  benefits?: string[];
  companyId: Types.ObjectId;
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
  skills?: string[];
  experience?: string;
  resume?: string,
  coverLetter?: string,
  appliedVia: "normal" | "whatsapp" | "referral";
  status: "pending" | "hired" | "rejected";
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