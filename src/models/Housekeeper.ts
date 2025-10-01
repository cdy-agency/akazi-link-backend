import mongoose, { Schema } from 'mongoose';
import { IFileInfo } from '../types/models';

export interface IHousekeeper extends mongoose.Document {
  fullName: string;
  dateOfBirth?: Date;
  gender?: string;
  idNumber: string;
  phoneNumber?: string;
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  };
  workPreferences?: {
    workDistrict?: string;
    workSector?: string;
    willingToWorkWithChildren?: boolean;
  };
  background?: {
    hasParents?: boolean;
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
    hasStudied?: boolean;
    educationLevel?: string;
    church?: string;
  };
  passportImage?: IFileInfo;
  fullBodyImage?: IFileInfo;
  status: 'available' | 'hired' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const FileInfoSchema = new Schema<IFileInfo>({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true },
});

const HousekeeperSchema: Schema<IHousekeeper> = new Schema(
  {
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String },
    idNumber: { type: String, required: true },
    phoneNumber: { type: String },
    location: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      sector: { type: String, required: true },
      cell: { type: String, required: true },
      village: { type: String, required: true },
    },
    workPreferences: {
      workDistrict: { type: String },
      workSector: { type: String },
      willingToWorkWithChildren: { type: Boolean },
    },
    background: {
      hasParents: { type: Boolean },
      fatherName: { type: String },
      fatherPhone: { type: String },
      motherName: { type: String },
      motherPhone: { type: String },
      hasStudied: { type: Boolean },
      educationLevel: { type: String },
      church: { type: String },
    },
    passportImage: { type: FileInfoSchema },
    fullBodyImage: { type: FileInfoSchema },
    status: {
      type: String,
      enum: ['available', 'hired', 'inactive'],
      default: 'available',
    },
  },
  { timestamps: true }
);

const Housekeeper = mongoose.model<IHousekeeper>('Housekeeper', HousekeeperSchema);
export default Housekeeper;

