import mongoose, { Schema, Types } from 'mongoose';
import { IFileInfo } from '../types/models';
import { FileInfoSchema } from './shared/FileInfoSchema';

export interface IProviderDocumentDoc {
  providerId: Types.ObjectId;
  label: string;
  file: IFileInfo;
  uploadedAt: Date;
}

const ProviderDocumentSchema = new Schema<IProviderDocumentDoc>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider',
      required: true,
      index: true,
    },
    label: { type: String, required: true },
    file: { type: FileInfoSchema, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProviderDocument = mongoose.model<IProviderDocumentDoc>(
  'ProviderDocument',
  ProviderDocumentSchema
);

export default ProviderDocument;
