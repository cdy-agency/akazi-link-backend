import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Housekeeper from '../models/Housekeeper';
import { parseSingleFile } from '../services/fileUploadService';
import { sendEmail } from '../utils/sendEmail';
import AdminNotification from '../models/AdminNotification';
import { IFileInfo } from '../types/models';


//  Dedicated single-image upload endpoint.
export const uploadHousekeeperImage = async (req: Request, res: Response) => {
  try {
    const image = parseSingleFile((req.body as any).image);

    if (!image) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    return res.status(200).json({ image });
  } catch (error) {
    console.error('Error uploading housekeeper image:', error);
    return res.status(500).json({ message: 'Image upload failed' });
  }
};


// Creates a new housekeeper. Receives plain JSON — image fields contain
export const createHousekeeper = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      province,
      district,
      sector,
      cell,
      village,
      idNumber,
      phoneNumber,
      passportImage,
      fullBodyImage,
      idImage,
    } = req.body;

    // Parse JSON fields (may arrive as strings if sent via FormData, or already objects via JSON)
    let location, workPreferences, background;
    try {
      location = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
      workPreferences = typeof req.body.workPreferences === 'string' ? JSON.parse(req.body.workPreferences) : req.body.workPreferences;
      background = typeof req.body.background === 'string' ? JSON.parse(req.body.background) : req.body.background;
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON format in location, workPreferences, or background fields' });
    }

    if (!fullName || !dateOfBirth || !gender || !idNumber || !phoneNumber || !location || !workPreferences || !background) {
      return res.status(400).json({
        message: 'Please provide all required fields: fullName, dateOfBirth, gender, idNumber, phoneNumber, location, workPreferences, background',
      });
    }

    // Images arrive as IFileInfo objects (already on Cloudinary) — just cast/validate them
    const parsedPassportImage: IFileInfo | undefined = passportImage?.url ? passportImage : undefined;
    const parsedFullBodyImage: IFileInfo | undefined = fullBodyImage?.url ? fullBodyImage : undefined;
    const parsedIdImage: IFileInfo | undefined = idImage?.url ? idImage : undefined;

    // Check if housekeeper with this idNumber already exists
    const existingHousekeeper = await Housekeeper.findOne({ idNumber });
    if (existingHousekeeper) {
      return res.status(400).json({ message: 'Housekeeper with this ID number already exists' });
    }

    const housekeeper = await Housekeeper.create({
      fullName,
      dateOfBirth,
      gender,
      idNumber,
      phoneNumber,
      location,
      province,
      district,
      sector,
      cell,
      village,
      workPreferences,
      background,
      ...(parsedPassportImage ? { passportImage: parsedPassportImage } : {}),
      ...(parsedFullBodyImage ? { fullBodyImage: parsedFullBodyImage } : {}),
      ...(parsedIdImage ? { idImage: parsedIdImage } : {}),
      status: 'available',
    });

    // Send admin notification email
    try {
      await sendEmail({
        type: 'housekeeperRegistration',
        to: process.env.SMTP_USER || '',
        data: {
          housekeeperName: fullName,
          idNumber,
          phoneNumber,
          location: `${location.province}, ${location.district}`,
        },
      });
    } catch (error) {
      console.error('Failed to notify admin about housekeeper registration', error);
    }

    // Create admin system notification
    try {
      await AdminNotification.create({
        message: `New housekeeper registered: ${fullName} (${idNumber})`,
        read: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to create admin system notification for housekeeper registration', error);
    }

    return res.status(201).json({
      message: 'Housekeeper registered successfully',
      housekeeper: housekeeper.toJSON(),
    });
  } catch (error) {
    console.error('Error creating housekeeper:', error);
    return res.status(500).json({ message: 'Server error during housekeeper registration' });
  }
};

// Get all housekeepers
export const getAllHousekeepers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const query: any = {};
    if (status && ['available', 'hired', 'inactive'].includes(status)) {
      query.status = status;
    }

    const [housekeepers, total] = await Promise.all([
      Housekeeper.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Housekeeper.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      message: 'Housekeepers retrieved successfully',
      housekeepers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error getting housekeepers:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get housekeeper by ID
export const getHousekeeperById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    const housekeeper = await Housekeeper.findById(id);

    if (!housekeeper) {
      return res.status(404).json({ message: 'Housekeeper not found' });
    }

    return res.status(200).json({ message: 'Housekeeper retrieved successfully', housekeeper });
  } catch (error) {
    console.error('Error getting housekeeper by ID:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update housekeeper
export const updateHousekeeper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, dateOfBirth, gender, phoneNumber, location, workPreferences, background } = req.body;

    const passportImage = parseSingleFile(req.body.passportImage);
    const fullBodyImage = parseSingleFile(req.body.fullBodyImage);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (location) updateData.location = location;
    if (workPreferences) updateData.workPreferences = workPreferences;
    if (background) updateData.background = background;
    if (passportImage) updateData.passportImage = passportImage;
    if (fullBodyImage) updateData.fullBodyImage = fullBodyImage;

    const housekeeper = await Housekeeper.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!housekeeper) {
      return res.status(404).json({ message: 'Housekeeper not found' });
    }

    return res.status(200).json({ message: 'Housekeeper updated successfully', housekeeper });
  } catch (error) {
    console.error('Error updating housekeeper:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete housekeeper
export const deleteHousekeeper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    const housekeeper = await Housekeeper.findByIdAndDelete(id);

    if (!housekeeper) {
      return res.status(404).json({ message: 'Housekeeper not found' });
    }

    return res.status(200).json({ message: 'Housekeeper deleted successfully' });
  } catch (error) {
    console.error('Error deleting housekeeper:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Update housekeeper status (admin only)
export const updateHousekeeperStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    if (!['available', 'hired', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be available, hired, or inactive' });
    }

    const housekeeper = await Housekeeper.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!housekeeper) {
      return res.status(404).json({ message: 'Housekeeper not found' });
    }

    return res.status(200).json({ message: 'Housekeeper status updated successfully', housekeeper });
  } catch (error) {
    console.error('Error updating housekeeper status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Search housekeepers by location
export const searchHousekeepersByLocation = async (req: Request, res: Response) => {
  try {
    const { province, district, sector, cell, village } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { status: 'available' };

    if (province) query['location.province'] = new RegExp(province as string, 'i');
    if (district) query['location.district'] = new RegExp(district as string, 'i');
    if (sector) query['location.sector'] = new RegExp(sector as string, 'i');
    if (cell) query['location.cell'] = new RegExp(cell as string, 'i');
    if (village) query['location.village'] = new RegExp(village as string, 'i');

    const [housekeepers, total] = await Promise.all([
      Housekeeper.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Housekeeper.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      message: 'Housekeepers found successfully',
      housekeepers,
      searchCriteria: { province, district, sector, cell, village },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error searching housekeepers by location:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};