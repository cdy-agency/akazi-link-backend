import mongoose, { Schema, Types } from 'mongoose';
import { IJob } from '../types/models';

const JobSchema: Schema = new Schema(
{
  title: { type: String},
  description: { type: String},
  image:{type: String},
  skills: { type: [String], default: [] },
  experience: { type: String },
  employmentType: {
    type: String,
    enum: ['fulltime', 'part-time', 'internship'],
  },
  salary: { type: String },
  category: { type: String},
  benefits: { type: [String], default: [] },
  companyId: { type: Types.ObjectId, ref: 'Company', required: true },
},
{ timestamps: true }
);

const Job = mongoose.model<IJob>('Job', JobSchema);
export default Job;
