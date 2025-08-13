import mongoose, { Schema, Types } from 'mongoose';
import { IWorkRequest } from '../types/models';

const WorkRequestSchema: Schema = new Schema(
{
  companyId: { type: Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Types.ObjectId, ref: 'Employee', required: true },
  message: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  notifications: {
    type: [
      new Schema(
        {
          message: { type: String, required: true },
          read: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
    ],
    default: [],
  },
},
{ timestamps: true }
);

const WorkRequest = mongoose.model<IWorkRequest>('WorkRequest', WorkRequestSchema);
export default WorkRequest;



