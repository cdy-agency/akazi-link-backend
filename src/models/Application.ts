import mongoose, { Schema, Types } from 'mongoose';
import { IApplication, IFileInfo, INotification } from '../types/models';

const FileInfoSchema = new Schema<IFileInfo>({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true }
});


const NotificationSchema: Schema = new Schema(
{
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
},
{ _id: false } // Do not create _id for subdocuments
);

const ApplicationSchema: Schema = new Schema(
{
  jobId: { type: Types.ObjectId, ref: 'Job', required: true },
  employeeId: { type: Types.ObjectId, ref: 'Employee', required: true },
  resume:{type: String},
  skills: { type: [String], default: [] },
  experience: { type: String },
  appliedVia: {
    type: String,
    enum: ['normal', 'whatsapp', 'referral'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'interview', 'hired', 'rejected'],
    default: 'pending',
  },
  notifications: { type: [NotificationSchema], default: [] },
},
{ timestamps: true }
);

const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
export default Application;
