import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/models';

const UserSchema: Schema = new Schema(
{
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'company', 'superadmin'], required: true },
},
{ timestamps: true }
);

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
