import { Request, Response } from 'express';
import { parseSingleFile, parseMultipleFiles } from '../services/fileUploadService';

// Upload single file
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = parseSingleFile((req.body as any).file);
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.status(200).json({
      message: 'File uploaded successfully',
      file
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    const files = parseMultipleFiles((req.body as any).files);
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    res.status(200).json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Server error during files upload' });
  }
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const profileImage = parseSingleFile((req.body as any).profileImage);
    
    if (!profileImage) {
      return res.status(400).json({ message: 'No profile image uploaded' });
    }

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      profileImage
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Server error during profile image upload' });
  }
};

// Upload passport image
export const uploadPassportImage = async (req: Request, res: Response) => {
  try {
    const passportImage = parseSingleFile((req.body as any).passportImage);
    
    if (!passportImage) {
      return res.status(400).json({ message: 'No passport image uploaded' });
    }

    res.status(200).json({
      message: 'Passport image uploaded successfully',
      passportImage
    });
  } catch (error) {
    console.error('Error uploading passport image:', error);
    res.status(500).json({ message: 'Server error during passport image upload' });
  }
};

// Upload full body image
export const uploadFullBodyImage = async (req: Request, res: Response) => {
  try {
    const fullBodyImage = parseSingleFile((req.body as any).fullBodyImage);
    
    if (!fullBodyImage) {
      return res.status(400).json({ message: 'No full body image uploaded' });
    }

    res.status(200).json({
      message: 'Full body image uploaded successfully',
      fullBodyImage
    });
  } catch (error) {
    console.error('Error uploading full body image:', error);
    res.status(500).json({ message: 'Server error during full body image upload' });
  }
};

