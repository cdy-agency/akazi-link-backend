import mongoose, { Schema, Types } from 'mongoose';
import { IJob } from '../types/models';
import { JOB_STATUSES } from '../config/job.config';

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
  companyId: { type: Types.ObjectId, ref: 'Company' },
  status: {
    type: String,
    enum: JOB_STATUSES,
    default: 'DRAFT',
  },
  createdByAdminId: { type: Types.ObjectId, ref: 'User' },
  updatedByAdminId: { type: Types.ObjectId, ref: 'User' },
  applicationDeadline: { type: String },
  applicationDeadlineAt: { type: Date },
  isActive: { type: Boolean, default: true }
},
{ timestamps: true }
);

JobSchema.index({ status: 1, createdAt: -1 });

const Job = mongoose.model<IJob>('Job', JobSchema);
export default Job;
