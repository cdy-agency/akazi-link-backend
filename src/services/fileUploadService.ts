import { Document, Model, UpdateQuery } from 'mongoose';
import { IFileInfo } from '../types/models';

export type ParsedFiles = IFileInfo[];

export const parseSingleFile = (input: unknown): IFileInfo | undefined => {
  if (!input) return undefined;
  if (typeof input === 'object' && input !== null && 'url' in (input as any)) {
    return input as IFileInfo;
  }
  return undefined;
};

export const parseMultipleFiles = (input: unknown): ParsedFiles => {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const files: IFileInfo[] = [];
  for (const item of arr) {
    const f = parseSingleFile(item);
    if (f) files.push(f);
  }
  return files;
};



// export const updateSingleFileFieldOptional = async (
//   model: Model<any>,
//   id: string,
//   path: string,
//   file: IFileInfo | undefined,
//   select = '-password'
// ) => {
//   if (!file) return null;

//   const update: UpdateQuery<any> = { $set: { [path]: file } };
//   return model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(select);
// };

export const updateSingleFileField = async <T extends { _id: any }>(
  model: Model<T>,
  id: string,
  path: string,
  file: IFileInfo | undefined,
  select = '-password'
) => {
  if (!file) {
    throw Object.assign(new Error('No file uploaded'), { statusCode: 400 });
  }

  const update: UpdateQuery<T> = { $set: { [path]: file } } as any;
  return model
    .findByIdAndUpdate(id, update, { new: true, runValidators: true })
    .select(select as any);
};


export const updateSingleFileFieldOptional = async (
  model: Model<Document>,
  id: string,
  path: string,
  file: IFileInfo | undefined,
  select = '-password'
) => {
  if (!file) return null;

  const update: UpdateQuery<any> = { $set: { [path]: file } };
  return model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(select as any);
};

export const pushMultipleFiles = async <T extends { _id: any }>(
  model: Model<T>,
  id: string,
  path: string,
  files: IFileInfo[],
  select = '-password'
) => {
  if (!files.length) {
    throw Object.assign(new Error('No documents uploaded'), { statusCode: 400 });
  }
  const update: UpdateQuery<T> = { $push: { [path]: { $each: files } } } as any;
  const doc = await model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(select as any);
  return doc;
};

export const replaceMultipleFiles = async <T extends { _id: any }>(
  model: Model<T>,
  id: string,
  path: string,
  files: IFileInfo[],
  select = '-password'
) => {
  if (!files.length) {
    throw Object.assign(new Error('No documents provided'), { statusCode: 400 });
  }
  const update: UpdateQuery<T> = { $set: { [path]: files } } as any;
  const doc = await model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(select as any);
  return doc;
};