import mongoose, { Schema } from 'mongoose';
import { IHousekeeper, ILocation, IFileInfo } from '../types/models';

// File interface for storing file information
const FileInfoSchema = new Schema<IFileInfo>({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true }
});

// Location schema
const LocationSchema = new Schema<ILocation>({
  province: { type: String },
  district: { type: String, required: true },
  sector: { type: String, required: true },
  cell: { type: String, required: true },
  village: { type: String, required: true }
});

// Work preferences schema
const WorkPreferencesSchema = new Schema({
  language: { type: String},
  amountOfMoney: { type: String},
  numberChildren: { type: String },
  workType: { type: String },
  vocationDays: { type: String },
  married: { type: String },
  willingToWorkWithChildren: { type: Boolean, required: true }
});

// Background information schema
const BackgroundSchema = new Schema({
  hasParents: { type: Boolean, required: true },
  fatherName: { type: String },
  fatherPhone: { type: String },
  motherName: { type: String },
  motherPhone: { type: String },
  hasStudied: { type: Boolean, required: true },
  educationLevel: { type: String },
  church: { type: String }
});

const HousekeeperSchema: Schema = new Schema<IHousekeeper>(
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
    location: { type: LocationSchema, required: true },
    workPreferences: { type: WorkPreferencesSchema},
    background: { type: BackgroundSchema, required: true },
    passportImage: { type: FileInfoSchema },
    fullBodyImage: { type: FileInfoSchema },
    idImage: { type: FileInfoSchema },
    status: {
      type: String,
      enum: ["available", "hired", "inactive"],
      default: "available"
    }
  },
  { timestamps: true }
);

const Housekeeper = mongoose.model<IHousekeeper>('Housekeeper', HousekeeperSchema);
export default Housekeeper;

