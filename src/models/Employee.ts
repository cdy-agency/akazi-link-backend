import mongoose, { Schema } from 'mongoose';
import { IEmployee } from '../types/models';
import User from './User'; // Import the base User model

const EmployeeSchema: Schema = new Schema(
{
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  phoneNumber: { type: String },
},
{ timestamps: true }
);

// Extend the User model with Employee-specific fields
const Employee = User.discriminator<IEmployee>('Employee', EmployeeSchema);
export default Employee;
