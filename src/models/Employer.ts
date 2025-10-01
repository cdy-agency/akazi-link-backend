import mongoose, { Schema } from 'mongoose';
import { IFileInfo } from '../types/models';

export interface IEmployer extends mongoose.Document {
  name: string;
  email?: string;
  nationalId: string;
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  };
  villageLeaderNumber?: string;
  partnerNumber?: string;
  churchName?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  profileImage?: IFileInfo;
  status: 'pending' | 'active' | 'completed' | 'inactive';
  selectedHousekeepers: mongoose.Types.ObjectId[];
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

const EmployerSchema: Schema<IEmployer> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    nationalId: { type: String, required: true },
    location: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      sector: { type: String, required: true },
      cell: { type: String, required: true },
      village: { type: String, required: true },
    },
    villageLeaderNumber: { type: String },
    partnerNumber: { type: String },
    churchName: { type: String },
    salaryRangeMin: { type: Number },
    salaryRangeMax: { type: Number },
    profileImage: { type: FileInfoSchema },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'inactive'],
      default: 'pending',
    },
    selectedHousekeepers: { type: [Schema.Types.ObjectId], ref: 'Housekeeper', default: [] },
  },
  { timestamps: true }
);

const Employer = mongoose.model<IEmployer>('Employer', EmployerSchema);
export default Employer;

