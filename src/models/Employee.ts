import { Schema } from 'mongoose';
import { IEmployee } from '../types/models';
import User from './User';

const EmployeeSchema: Schema = new Schema(
{
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  phoneNumber: { type: String },
  jobPreferences: { type: [String], default: [] },
  about: { type: String },
  experience: { type: String },
  education: { type: String },
  profileImage: { type: String },
  skills: { type: [String], default: [] },
  documents: { type: [String], default: [] },
},
{ timestamps: true }
);

// Extend the User model with Employee-specific fields
const Employee = User.discriminator<IEmployee>('Employee', EmployeeSchema);
export default Employee;
