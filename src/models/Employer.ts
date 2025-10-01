import mongoose, { Schema } from 'mongoose';
import { IEmployer } from '../types/models';
import User from './User';

const EmployerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    nationalId: { type: String, required: true, unique: true },
    location: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      sector: { type: String, required: true },
      cell: { type: String, required: true },
      village: { type: String, required: true }
    },
    villageLeaderNumber: { type: String, required: true },
    partnerNumber: { type: String, required: true },
    churchName: { type: String, required: true },
    salaryRangeMin: { type: Number, required: true },
    salaryRangeMax: { type: Number, required: true },
    profileImage: { type: Schema.Types.Mixed },
    status: { 
      type: String, 
      enum: ["pending", "active", "completed"], 
      default: "pending" 
    },
    selectedHousekeepers: [{ type: Schema.Types.ObjectId, ref: 'Housekeeper' }]
  },
  { timestamps: true }
);

// Extend the User model with Employer-specific fields
const Employer = User.discriminator<IEmployer>('Employer', EmployerSchema);
export default Employer;