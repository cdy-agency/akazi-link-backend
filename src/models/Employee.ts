import { Schema } from 'mongoose';
import { IEmployee } from '../types/models';
import User from './User';

const EmployeeSchema: Schema = new Schema(
{
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  phoneNumber: { type: String },
  location:{type:String},
  image:{type: String},
  jobPreferences: { type: [String], default: [] },
  about: { type: String },
  experience: { type: String },
  education: { type: String },
  profileImage: { type: Schema.Types.Mixed }, // Can be string or IFileInfo object
  skills: { type: [String], default: [] },
  documents: { type: [Schema.Types.Mixed], default: [] }, // Can be string[] or IFileInfo[]
},
{ timestamps: true }
);

// Extend the User model with Employee-specific fields
const Employee = User.discriminator<IEmployee>('Employee', EmployeeSchema);
export default Employee;
