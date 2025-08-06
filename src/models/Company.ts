import mongoose, { Schema } from 'mongoose';
import { ICompany } from '../types/models';
import User from './User'; // Import the base User model

const CompanySchema: Schema = new Schema(
{
  companyName: { type: String, required: true },
  location: { type: String },
  phoneNumber: { type: String },
  website: { type: String },
  logo: { type: String }, // URL to logo
  isApproved: { type: Boolean, default: false },
},
{ timestamps: true }
);

// Extend the User model with Company-specific fields
const Company = User.discriminator<ICompany>('Company', CompanySchema);
export default Company;
