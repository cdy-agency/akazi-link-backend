import mongoose, { Schema } from 'mongoose';
import { IEmailOtp } from '../types/models';

const EmailOtpSchema: Schema<IEmailOtp> = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

EmailOtpSchema.index({ email: 1, createdAt: -1 });
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model<IEmailOtp>('EmailOtp', EmailOtpSchema);
export default EmailOtp;
