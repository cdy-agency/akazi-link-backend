import mongoose, { Schema, Types } from 'mongoose';
import { IFileInfo, IJob } from '../types/models';

const FileInfoSchema = new Schema<IFileInfo>({ 
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true }
});

const JobSchema: Schema = new Schema(
{
  title: { type: String},
  description: { type: String},
  image:{type: FileInfoSchema},
  skills: { type: [String], default: [], required: true},
  province: { type: String, required: true},
  district: { type: String, required: true},
  experience: { type: String },
  employmentType: {
    type: String,
    enum: ['fulltime', 'part-time', 'internship'],
  },
  salaryMin: { type: String },
  salaryMax: { type: String },
  category: { type: String},
  responsibilities: { type: [String], default: [] , required: true},
  benefits: { type: [String], default: [], required: true },
  companyId: { type: Types.ObjectId, ref: 'Company', required: true },
  applicationDeadline: { type: String },
  applicationDeadlineAt: { type: Date },
  isActive: { type: Boolean, default: true }
},
{ timestamps: true }
);

const Job = mongoose.model<IJob>('Job', JobSchema);
export default Job;
