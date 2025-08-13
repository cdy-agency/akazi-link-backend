import mongoose, { Schema } from 'mongoose';
import { ICompany } from '../types/models';
import User from './User'; // Import the base User model

const CompanySchema: Schema = new Schema(
{
  companyName: { type: String, required: true },
  location: { type: String },
  phoneNumber: { type: String },
  website: { type: String },
  logo: { type: String },
  isApproved: { type: Boolean, default: false },
  password: {type: String, require: true},
  about: { type: String },
  documents: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'disabled', 'deleted'], 
    default: 'pending' 
  },
  isActive: { type: Boolean, default: true },
  rejectionReason: { type: String },
  disabledAt: { type: Date },
  deletedAt: { type: Date },
},
{ timestamps: true }
);

// Extend the User model with Company-specific fields
const Company = User.discriminator<ICompany>('Company', CompanySchema);
export default Company;
