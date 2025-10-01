import mongoose, { Schema } from 'mongoose';
import { IHousekeeper } from '../types/models';
import User from './User';

const HousekeeperSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { 
      type: String, 
      enum: ["male", "female"], 
      required: true 
    },
    idNumber: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    location: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      sector: { type: String, required: true },
      cell: { type: String, required: true },
      village: { type: String, required: true }
    },
    workPreferences: {
      workDistrict: { type: String, required: true },
      workSector: { type: String, required: true },
      willingToWorkWithChildren: { type: Boolean, required: true }
    },
    background: {
      hasParents: { type: Boolean, required: true },
      fatherName: { type: String },
      fatherPhone: { type: String },
      motherName: { type: String },
      motherPhone: { type: String },
      hasStudied: { type: Boolean, required: true },
      educationLevel: { type: String },
      church: { type: String }
    },
    passportImage: { type: Schema.Types.Mixed },
    fullBodyImage: { type: Schema.Types.Mixed },
    status: { 
      type: String, 
      enum: ["available", "hired", "inactive"], 
      default: "available" 
    }
  },
  { timestamps: true }
);

// Extend the User model with Housekeeper-specific fields
const Housekeeper = User.discriminator<IHousekeeper>('Housekeeper', HousekeeperSchema);
export default Housekeeper;