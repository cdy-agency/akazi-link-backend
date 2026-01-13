import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/models';

const UserSchema: Schema = new Schema(
{
  email: { type: String, required: true, unique: true },
  image: { type: String },
  password: { type: String},
  provider: { type: String, enum: ['EMAIL', 'GOOGLE', 'LINKEDIN'], default: 'EMAIL' },
  role: { type: String, enum: ['employee', 'company', 'superadmin'], default: null },
  isActive: { type: Boolean, default: true },
},
{ timestamps: true }
);

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
