import mongoose, { Schema, Types } from 'mongoose';
import { IJob } from '../types/models';

const JobSchema: Schema = new Schema(
{
  title: { type: String, required: true },
  description: { type: String, required: true },
  skills: { type: [String], default: [] },
  experience: { type: String },
  employmentType: {
    type: String,
    enum: ['fulltime', 'part-time', 'internship'],
    required: true,
  },
  salary: { type: String },
  category: { type: String, required: true },
  companyId: { type: Types.ObjectId, ref: 'Company', required: true },
},
{ timestamps: true }
);

const Job = mongoose.model<IJob>('Job', JobSchema);
export default Job;
