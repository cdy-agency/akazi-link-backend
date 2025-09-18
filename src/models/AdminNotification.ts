import mongoose, { Schema } from 'mongoose';

interface IAdminNotificationDoc {
  message: string;
  read: boolean;
  createdAt: Date;
}

const AdminNotificationSchema: Schema = new Schema(
  {
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const AdminNotification = mongoose.model<IAdminNotificationDoc>('AdminNotification', AdminNotificationSchema);
export default AdminNotification;

