/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Employer from '../models/Employer';
import Housekeeper from '../models/Housekeeper';
import { Types } from 'mongoose';
import { parseSingleFile } from '../services/fileUploadService';

// Create Employer
export const createEmployer = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      nationalId,
      location,
      villageLeaderNumber,
      partnerNumber,
      churchName,
      salaryRangeMin,
      salaryRangeMax
    } = req.body;

    // Parse profile image if uploaded
    const profileImage = parseSingleFile((req.body as any).profileImage);

    const employer = await Employer.create({
      name,
      email,
      nationalId,
      location,
      villageLeaderNumber,
      partnerNumber,
      churchName,
      salaryRangeMin,
      salaryRangeMax,
      profileImage,
      role: 'employer',
      isActive: true
    });

    res.status(201).json({ 
      message: 'Employer created successfully', 
      employer 
    });
  } catch (error) {
    console.error('Error creating employer:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(400).json({ message: 'Employer with this national ID already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all Employers
export const getAllEmployers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const employers = await Employer.find({ isActive: true })
      .populate('selectedHousekeepers', 'fullName phoneNumber status')
      .skip(skip)
      .limit(limit)
      .select('-password');

    const total = await Employer.countDocuments({ isActive: true });

    res.status(200).json({
      message: 'Employers retrieved successfully',
      employers,
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
    console.error('Error getting employers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Employer by ID
export const getEmployerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    const employer = await Employer.findById(id)
      .populate('selectedHousekeepers', 'fullName phoneNumber status location workPreferences')
      .select('-password');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.status(200).json({ 
      message: 'Employer retrieved successfully', 
      employer 
    });
  } catch (error) {
    console.error('Error getting employer by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Employer
export const updateEmployer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.role;
    delete updates.password;
    delete updates.selectedHousekeepers;

    // Parse profile image if uploaded
    const profileImage = parseSingleFile((req.body as any).profileImage);
    if (profileImage) {
      updates.profileImage = profileImage;
    }

    const employer = await Employer.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.status(200).json({ 
      message: 'Employer updated successfully', 
      employer 
    });
  } catch (error) {
    console.error('Error updating employer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Employer
export const deleteEmployer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    const employer = await Employer.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.status(200).json({ 
      message: 'Employer deleted successfully', 
      employer 
    });
  } catch (error) {
    console.error('Error deleting employer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Matching Housekeepers
export const getMatchingHousekeepers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { salaryRange, workWithChildren } = req.query;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    const employer = await Employer.findById(id).select('location salaryRangeMin salaryRangeMax');
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Build match query
    const matchQuery: any = {
      isActive: true,
      status: 'available',
      'location.province': employer.location.province,
      'location.district': employer.location.district,
      'location.sector': employer.location.sector
    };

    // Add salary range filter if provided
    if (salaryRange === 'true') {
      matchQuery['workPreferences.workDistrict'] = employer.location.district;
    }

    // Add children work preference filter if provided
    if (workWithChildren === 'true') {
      matchQuery['workPreferences.willingToWorkWithChildren'] = true;
    }

    const housekeepers = await Housekeeper.find(matchQuery)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Matching housekeepers retrieved successfully',
      housekeepers,
      totalMatches: housekeepers.length
    });
  } catch (error) {
    console.error('Error getting matching housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Select Housekeepers
export const selectHousekeepers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { housekeeperIds } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    if (!Array.isArray(housekeeperIds) || housekeeperIds.length === 0) {
      return res.status(400).json({ message: 'housekeeperIds must be a non-empty array' });
    }

    if (housekeeperIds.length > 2) {
      return res.status(400).json({ message: 'Cannot select more than 2 housekeepers' });
    }

    // Validate all housekeeper IDs
    const validIds = housekeeperIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== housekeeperIds.length) {
      return res.status(400).json({ message: 'Invalid housekeeper ID(s) provided' });
    }

    // Check if housekeepers exist and are available
    const housekeepers = await Housekeeper.find({
      _id: { $in: validIds },
      status: 'available',
      isActive: true
    });

    if (housekeepers.length !== validIds.length) {
      return res.status(400).json({ 
        message: 'Some housekeepers are not available or do not exist' 
      });
    }

    // Update employer with selected housekeepers
    const employer = await Employer.findByIdAndUpdate(
      id,
      { 
        $set: { 
          selectedHousekeepers: validIds,
          status: 'active'
        }
      },
      { new: true, runValidators: true }
    ).populate('selectedHousekeepers', 'fullName phoneNumber status location workPreferences');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Update housekeeper status to hired
    await Housekeeper.updateMany(
      { _id: { $in: validIds } },
      { $set: { status: 'hired' } }
    );

    res.status(200).json({
      message: 'Housekeepers selected successfully',
      employer,
      selectedHousekeepers: housekeepers
    });
  } catch (error) {
    console.error('Error selecting housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Employer Status
export const updateEmployerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    if (!['pending', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be one of: pending, active, completed' 
      });
    }

    const employer = await Employer.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.status(200).json({ 
      message: 'Employer status updated successfully', 
      employer 
    });
  } catch (error) {
    console.error('Error updating employer status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};