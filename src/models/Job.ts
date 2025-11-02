import mongoose, { Schema, Types } from 'mongoose';
import { IJob } from '../types/models';


const JobSchema: Schema = new Schema(
{
  title: { type: String},
  description: { type: String},
  skills: { type: [String], default: [], required: true},
  province: { type: String, required: true},
  district: { type: String, required: true},
  experience: { type: String },
  employmentType: {
    type: String,
    enum: ['fulltime', 'part-time', 'internship'],
  },
  salary: { type: String },
  category: { type: String},
  otherBenefits: { type: [String], default: []},
  responsibilities: { type: [String], default: []},
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
