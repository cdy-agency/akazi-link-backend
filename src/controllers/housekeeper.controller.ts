import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Housekeeper from '../models/Housekeeper';
import { parseSingleFile, parseMultipleFiles } from '../services/fileUploadService';
import { sendEmail } from '../utils/sendEmail';
import AdminNotification from '../models/AdminNotification';

// Create new housekeeper
export const createHousekeeper = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      idNumber,
      phoneNumber
    } = req.body;

    // Parse JSON fields from FormData
    let location, workPreferences, background;
    try {
      location = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
      workPreferences = typeof req.body.workPreferences === 'string' ? JSON.parse(req.body.workPreferences) : req.body.workPreferences;
      background = typeof req.body.background === 'string' ? JSON.parse(req.body.background) : req.body.background;
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON format in location, workPreferences, or background fields' });
    }

    // Handle multiple file upload - extract passport and full body images
    const uploadedImages = parseMultipleFiles((req.body as any).images);
    const passportImage = uploadedImages.find((img: any) => img.name?.toLowerCase().includes('passport')) || uploadedImages[0];
    const fullBodyImage = uploadedImages.find((img: any) => img.name?.toLowerCase().includes('fullbody') || img.name?.toLowerCase().includes('full-body')) || uploadedImages[1];

    if (!fullName || !dateOfBirth || !gender || !idNumber || !phoneNumber || !location || !workPreferences || !background) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: fullName, dateOfBirth, gender, idNumber, phoneNumber, location, workPreferences, background' 
      });
    }

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
      workPreferences,
      background,
      ...(passportImage ? { passportImage } : {}),
      ...(fullBodyImage ? { fullBodyImage } : {}),
      status: 'available'
    });

    // Send admin notification
    try {
      await sendEmail({
        type: 'housekeeperRegistration',
        to: process.env.SMTP_USER || '',
        data: {
          housekeeperName: fullName,
          idNumber,
          phoneNumber,
          location: `${location.province}, ${location.district}`,
          workDistrict: workPreferences.workDistrict,
          workSector: workPreferences.workSector
        }
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

    res.status(201).json({ 
      message: 'Housekeeper registered successfully', 
      housekeeper: housekeeper.toJSON() 
    });
  } catch (error) {
    console.error('Error creating housekeeper:', error);
    res.status(500).json({ message: 'Server error during housekeeper registration' });
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
      Housekeeper.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Housekeeper.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Housekeepers retrieved successfully',
      housekeepers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
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

    res.status(200).json({
      message: 'Housekeeper retrieved successfully',
      housekeeper
    });
  } catch (error) {
    console.error('Error getting housekeeper by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update housekeeper
export const updateHousekeeper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      dateOfBirth,
      gender,
      phoneNumber,
      location,
      workPreferences,
      background
    } = req.body;

    const passportImage = parseSingleFile((req.body as any).passportImage);
    const fullBodyImage = parseSingleFile((req.body as any).fullBodyImage);

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

    res.status(200).json({
      message: 'Housekeeper updated successfully',
      housekeeper
    });
  } catch (error) {
    console.error('Error updating housekeeper:', error);
    res.status(500).json({ message: 'Server error' });
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

    res.status(200).json({ message: 'Housekeeper deleted successfully' });
  } catch (error) {
    console.error('Error deleting housekeeper:', error);
    res.status(500).json({ message: 'Server error' });
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

    res.status(200).json({
      message: 'Housekeeper status updated successfully',
      housekeeper
    });
  } catch (error) {
    console.error('Error updating housekeeper status:', error);
    res.status(500).json({ message: 'Server error' });
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
      Housekeeper.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Housekeeper.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Housekeepers found successfully',
      housekeepers,
      searchCriteria: { province, district, sector, cell, village },
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching housekeepers by location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

