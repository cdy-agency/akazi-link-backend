import { Schema } from 'mongoose';
import { IFileInfo } from '../../types/models';

export const FileInfoSchema = new Schema<IFileInfo>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    format: { type: String, required: true },
    size: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    time: { type: String, required: true },
  },
  { _id: false }
);

export const BusinessHoursSchema = new Schema(
  {
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);
