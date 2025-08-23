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
  skills: { type: [String], default: [] },
  location: { type: String},
  experience: { type: String },
  employmentType: {
    type: String,
    enum: ['fulltime', 'part-time', 'internship'],
  },
  salaryMin: { type: String },
  salaryMax: { type: String },
  category: { type: String},
  responsibilities: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  companyId: { type: Types.ObjectId, ref: 'Company', required: true },
  applicationDeadline: { type: String }
},
{ timestamps: true }
);

const Job = mongoose.model<IJob>('Job', JobSchema);
export default Job;
