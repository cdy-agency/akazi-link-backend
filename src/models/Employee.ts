import { Schema } from 'mongoose';
import { IEmployee } from '../types/models';
import User from './User';

const EmployeeSchema: Schema = new Schema(
{
  name: { type: String },
  dateOfBirth: { type: Date },
  phoneNumber: { type: String },
  district:{type:String},
  province:{type:String},
  gender:{type:String},
  location:{type:String},
  image:{type: String},
  jobPreferences: { type: [String], default: [] },
  about: { type: String },
  experience: { type: String },
  education: { type: String },
  profileImage: { type: Schema.Types.Mixed }, 
  skills: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  certificates: { type: [String], default: [] },
  documents: { type: [Schema.Types.Mixed], default: [] },
  primaryCvId: { type: Schema.Types.ObjectId, ref: 'CvDocument', default: null },
  profileStatus: {
    type: String,
    enum: ['DRAFT', 'REVIEW_REQUIRED', 'APPROVED'],
    default: 'DRAFT',
    index: true,
  },
  profileReviewStatus: {
    type: String,
    enum: ['REVIEW_REQUIRED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'REVIEW_REQUIRED',
  },
  profileApprovedAt: { type: Date },
  profileReviewData: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    professionalSummary: { type: String },
    skills: { type: [String], default: [] },
    interviewSkills: { type: [String], default: [] },
    education: { type: [String], default: [] },
    experience: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    certificates: { type: [String], default: [] },
    linkedInUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },
    yearsOfExperience: { type: Number },
  },
  profileReviewCvId: {
    type: Schema.Types.ObjectId,
    ref: 'CvDocument',
    default: null,
  },
},
{ timestamps: true }
);

// Extend the User model with Employee-specific fields
const Employee = User.discriminator<IEmployee>('Employee', EmployeeSchema);
export default Employee;
