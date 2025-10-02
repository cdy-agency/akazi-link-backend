import mongoose, { Schema } from 'mongoose';
import { IEmployer, ILocation, IFileInfo } from '../types/models';

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
  province: { type: String, required: true },
  district: { type: String, required: true },
  sector: { type: String, required: true },
  cell: { type: String, required: true },
  village: { type: String, required: true }
});

const EmployerSchema: Schema = new Schema<IEmployer>(
  {
    name: { type: String, required: true },
    email: { type: String },
    phoneNumber: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },
    location: { type: LocationSchema, required: true },
    villageLeaderNumber: { type: String, required: true },
    partnerNumber: { type: String, required: true },
    churchName: { type: String, required: true },
    salaryRangeMin: { type: Number, required: true },
    salaryRangeMax: { type: Number, required: true },
    profileImage: { type: FileInfoSchema },
    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending"
    },
    selectedHousekeepers: [{ type: Schema.Types.ObjectId, ref: 'Housekeeper' }]
  },
  { timestamps: true }
);

const Employer = mongoose.model<IEmployer>('Employer', EmployerSchema);
export default Employer;

