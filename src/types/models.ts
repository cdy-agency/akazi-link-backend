import { Document, Types } from 'mongoose';

export interface IUser extends Document {
email: string;
image?: string;
password?: string;
role: 'employee' | 'company' | 'superadmin';
createdAt: Date;
updatedAt: Date;
}

export interface ICompany extends IUser {
companyName: string;
location?: string;
phoneNumber?: string;
website?: string;
logo?: string; // URL to logo
isApproved: boolean;
password: string;
about?: string;
documents?: string[];
status: 'pending' | 'approved' | 'rejected' | 'disabled' | 'deleted';
isActive: boolean;
rejectionReason?: string;
disabledAt?: Date;
deletedAt?: Date;
}

export interface IEmployee extends IUser {
name: string;
dateOfBirth?: Date;
phoneNumber?: string;
  jobPreferences?: string[];
  about?: string;
  experience?: string;
  education?: string;
  profileImage?: string;
  skills?: string[];
  documents?: string[];
}

export interface IJob extends Document {
title: string;
description: string;
skills: string[];
image: String
experience: string;
employmentType: 'fulltime' | 'part-time' | 'internship';
salary?: string;
category: string;
  benefits?: string[];
companyId: Types.ObjectId;
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
appliedVia: 'normal' | 'whatsapp' | 'referral';
status: 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected';
notifications: INotification[];
createdAt: Date;
updatedAt: Date;
}

export interface IWorkRequest extends Document {
  companyId: Types.ObjectId;
  employeeId: Types.ObjectId;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  notifications: INotification[];
  createdAt: Date;
  updatedAt: Date;
}
