import mongoose, { Schema } from "mongoose";
import { IPublicFlyer, IFileInfo } from "../types/models";

const FileInfoSchema = new Schema<IFileInfo>({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true },
});

// Reply schema
const ReplySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Comment schema
const CommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [ReplySchema],
});

const PublicSchema = new Schema<IPublicFlyer>({
  title: { type: String },
  description: { type: String },
  image: { type: FileInfoSchema },
  url: { type: String },
  from: { type: String },
  end: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const PublicFlyerModel = mongoose.model<IPublicFlyer>(
  "publicFlyer",
  PublicSchema
);
