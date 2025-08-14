import mongoose, { Schema } from 'mongoose';
import { ICompany } from '../types/models';
import User from './User'; // Import the base User model

// File interface for storing file information
interface IFileInfo {
  url: string;
  public_id: string;
  format: string;
  size: number;
  name: string;
  type: string;
  time: string;
}

const FileInfoSchema = new Schema<IFileInfo>({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true }
});

const CompanySchema: Schema = new Schema(
{
  companyName: { type: String, required: true },
  location: { type: String },
  phoneNumber: { type: String },
  website: { type: String },
  logo: { type: FileInfoSchema }, 
  isApproved: { type: Boolean, default: false },
  password: {type: String, require: true},
  about: { type: String },
  documents: { type: [FileInfoSchema], default: [] },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'disabled', 'deleted'], 
    default: 'pending' 
  },
  isActive: { type: Boolean, default: true },
  rejectionReason: { type: String },
  disabledAt: { type: Date },
  deletedAt: { type: Date },
  profileCompletionStatus: {
    type: String,
    enum: ['incomplete', 'complete', 'pending_review'],
    default: 'incomplete'
  },
  profileCompletedAt: { type: Date },
},
{ timestamps: true }
);

// Extend the User model with Company-specific fields
const Company = User.discriminator<ICompany>('Company', CompanySchema);
export default Company;
