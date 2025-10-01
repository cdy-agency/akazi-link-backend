/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { parseSingleFile } from '../services/fileUploadService';

export const uploadFile = async (req: any, res: any) => {
  try {
    const file = parseSingleFile((req.body as any).file || (req.body as any).image || (req.body as any).document);
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    res.status(200).json({ message: 'File uploaded', url: file.url, file });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

