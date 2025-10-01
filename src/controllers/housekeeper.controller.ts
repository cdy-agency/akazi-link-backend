/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Housekeeper from '../models/Housekeeper';
import { Types } from 'mongoose';
import { parseSingleFile, parseMultipleFiles } from '../services/fileUploadService';

// Create Housekeeper
export const createHousekeeper = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      idNumber,
      phoneNumber,
      location,
      workPreferences,
      background
    } = req.body;

    // Parse uploaded images
    const images = parseMultipleFiles((req.body as any).images);
    const passportImage = images.find(img => img.name?.includes('passport') || img.type?.includes('passport'));
    const fullBodyImage = images.find(img => img.name?.includes('body') || img.type?.includes('body'));

    const housekeeper = await Housekeeper.create({
      fullName,
      dateOfBirth,
      gender,
      idNumber,
      phoneNumber,
      location,
      workPreferences,
      background,
      passportImage,
      fullBodyImage,
      role: 'housekeeper',
      isActive: true
    });

    res.status(201).json({ 
      message: 'Housekeeper created successfully', 
      housekeeper 
    });
  } catch (error) {
    console.error('Error creating housekeeper:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(400).json({ message: 'Housekeeper with this ID number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all Housekeepers
export const getAllHousekeepers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { status, province, district } = req.query;

    // Build filter query
    const filterQuery: any = { isActive: true };
    
    if (status) {
      filterQuery.status = status;
    }
    if (province) {
      filterQuery['location.province'] = province;
    }
    if (district) {
      filterQuery['location.district'] = district;
    }

    const housekeepers = await Housekeeper.find(filterQuery)
      .skip(skip)
      .limit(limit)
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await Housekeeper.countDocuments(filterQuery);

    res.status(200).json({
      message: 'Housekeepers retrieved successfully',
      housekeepers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Housekeeper by ID
export const getHousekeeperById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    const housekeeper = await Housekeeper.findById(id).select('-password');

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

// Update Housekeeper
export const updateHousekeeper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.role;
    delete updates.password;

    // Parse uploaded images if provided
    const images = parseMultipleFiles((req.body as any).images);
    if (images.length > 0) {
      const passportImage = images.find(img => img.name?.includes('passport') || img.type?.includes('passport'));
      const fullBodyImage = images.find(img => img.name?.includes('body') || img.type?.includes('body'));
      
      if (passportImage) {
        updates.passportImage = passportImage;
      }
      if (fullBodyImage) {
        updates.fullBodyImage = fullBodyImage;
      }
    }

    const housekeeper = await Housekeeper.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

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

// Delete Housekeeper
export const deleteHousekeeper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    const housekeeper = await Housekeeper.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');

    if (!housekeeper) {
      return res.status(404).json({ message: 'Housekeeper not found' });
    }

    res.status(200).json({ 
      message: 'Housekeeper deleted successfully', 
      housekeeper 
    });
  } catch (error) {
    console.error('Error deleting housekeeper:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Housekeeper Status
export const updateHousekeeperStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    if (!['available', 'hired', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be one of: available, hired, inactive' 
      });
    }

    const housekeeper = await Housekeeper.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).select('-password');

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

// Upload Housekeeper Images
export const uploadHousekeeperImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid housekeeper ID' });
    }

    const images = parseMultipleFiles((req.body as any).images);

    if (images.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const passportImage = images.find(img => img.name?.includes('passport') || img.type?.includes('passport'));
    const fullBodyImage = images.find(img => img.name?.includes('body') || img.type?.includes('body'));

    const updates: any = {};
    if (passportImage) updates.passportImage = passportImage;
    if (fullBodyImage) updates.fullBodyImage = fullBodyImage;

    const housekeeper = await Housekeeper.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!housekeeper) {
      return res.status(404).json({ message: 'Housekeeper not found' });
    }

    res.status(200).json({ 
      message: 'Images uploaded successfully', 
      housekeeper 
    });
  } catch (error) {
    console.error('Error uploading housekeeper images:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search Housekeepers
export const searchHousekeepers = async (req: Request, res: Response) => {
  try {
    const { 
      province, 
      district, 
      sector, 
      workWithChildren, 
      educationLevel,
      hasStudied,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build search query
    const searchQuery: any = { 
      isActive: true, 
      status: 'available' 
    };

    if (province) {
      searchQuery['location.province'] = new RegExp(province as string, 'i');
    }
    if (district) {
      searchQuery['location.district'] = new RegExp(district as string, 'i');
    }
    if (sector) {
      searchQuery['location.sector'] = new RegExp(sector as string, 'i');
    }
    if (workWithChildren === 'true') {
      searchQuery['workPreferences.willingToWorkWithChildren'] = true;
    }
    if (educationLevel) {
      searchQuery['background.educationLevel'] = new RegExp(educationLevel as string, 'i');
    }
    if (hasStudied !== undefined) {
      searchQuery['background.hasStudied'] = hasStudied === 'true';
    }

    const housekeepers = await Housekeeper.find(searchQuery)
      .skip(skip)
      .limit(Number(limit))
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await Housekeeper.countDocuments(searchQuery);

    res.status(200).json({
      message: 'Search results retrieved successfully',
      housekeepers,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
        hasPrevPage: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error searching housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};