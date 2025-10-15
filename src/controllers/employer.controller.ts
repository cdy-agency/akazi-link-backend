import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Employer from '../models/Employer';
import Housekeeper from '../models/Housekeeper';
import { parseSingleFile } from '../services/fileUploadService';
import { sendEmail } from '../utils/sendEmail';
import AdminNotification from '../models/AdminNotification';

// Create new employer
export const createEmployer = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      nationalId,
      villageLeaderNumber,
      partnerNumber,
      churchName,
      salary,
      married,
      familyMembers,
      allTasks,
      vocationDays,
      water, 
      electricity,
    } = req.body;

    // Parse JSON fields from FormData
    let location;
    try {
      location = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON format in location field' });
    }

    const profileImage = parseSingleFile((req.body as any).profileImage);

    if (!name || !phoneNumber || !nationalId || !location || !villageLeaderNumber || !partnerNumber || !churchName || !salary) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: name, phoneNumber, nationalId, location, villageLeaderNumber, partnerNumber, churchName, salaryRangeMin, salaryRangeMax' 
      });
    }

    // Check if employer with this nationalId already exists
    const existingEmployer = await Employer.findOne({ nationalId });
    if (existingEmployer) {
      return res.status(400).json({ message: 'Employer with this national ID already exists' });
    }

    let parsedTasks: string[] = [];
      try {
        parsedTasks =
          typeof req.body.allTasks === "string"
            ? JSON.parse(req.body.allTasks)
            : Array.isArray(req.body.allTasks)
            ? req.body.allTasks
            : [];
      } catch {
        parsedTasks = [];
    }

    const employer = await Employer.create({
      name,
      email,
      phoneNumber,
      nationalId,
      location,
      villageLeaderNumber,
      partnerNumber,
      churchName,
      salary: parseInt(salary),
      married,
      familyMembers,
      allTasks: parsedTasks,
      electricity,
      water,
      vocationDays,
      ...(profileImage ? { profileImage } : {}),
      status: 'pending'
    });

    // Send admin notification
    try {
      await sendEmail({
        type: 'employerRegistration',
        to: process.env.SMTP_USER || '',
        data: {
          employerName: name,
          email: email || 'No email provided',
          nationalId,
          location: `${location.province}, ${location.district}`,
          salaryRange: `${salary}`
        }
      });
    } catch (error) {
      console.error('Failed to notify admin about employer registration', error);
    }

    // Create admin system notification
    try {
      await AdminNotification.create({
        message: `New employer registered: ${name} (${nationalId})`,
        read: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to create admin system notification for employer registration', error);
    }

    res.status(201).json({ 
      message: 'Employer registered successfully', 
      employer: employer.toJSON() 
    });
  } catch (error) {
    console.error('Error creating employer:', error);
    res.status(500).json({ message: 'Server error during employer registration' });
  }
};

// Get all employers
export const getAllEmployers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [employers, total] = await Promise.all([
      Employer.find()
        .populate('selectedHousekeepers', 'fullName phoneNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Employer.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Employers retrieved successfully',
      employers,
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
    console.error('Error getting employers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employer by ID
export const getEmployerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    const employer = await Employer.findById(id)
      .populate('selectedHousekeepers', 'fullName phoneNumber status location workPreferences passportImage');

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

// Update employer
export const updateEmployer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      location,
      villageLeaderNumber,
      partnerNumber,
      churchName,
      salaryRangeMin,
      salaryRangeMax
    } = req.body;

    const profileImage = parseSingleFile((req.body as any).profileImage);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (location) updateData.location = location;
    if (villageLeaderNumber) updateData.villageLeaderNumber = villageLeaderNumber;
    if (partnerNumber) updateData.partnerNumber = partnerNumber;
    if (churchName) updateData.churchName = churchName;
    if (salaryRangeMin) updateData.salaryRangeMin = salaryRangeMin;
    if (salaryRangeMax) updateData.salaryRangeMax = salaryRangeMax;
    if (profileImage) updateData.profileImage = profileImage;

    const employer = await Employer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('selectedHousekeepers', 'fullName phoneNumber status');

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

// Delete employer
export const deleteEmployer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    const employer = await Employer.findByIdAndDelete(id);

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.status(200).json({ message: 'Employer deleted successfully' });
  } catch (error) {
    console.error('Error deleting employer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get matching housekeepers for an employer
export const getMatchingHousekeepers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid employer ID" });
    }

    const employer = await Employer.findById(id);
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    // Build OR conditions for location and workPreferences
    const matchConditions = [
      { "location.sector": employer.location.sector },
      { "location.cell": employer.location.cell },
      { "location.village": employer.location.village },
      { "workPreferences.workSector": employer.location.sector },
      { "workPreferences.workDistrict": employer.location.district },
    ];

    // Query available housekeepers
    const matchingHousekeepers = await Housekeeper.find({
      status: "available",
      $or: matchConditions,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Matching housekeepers retrieved successfully",
      housekeepers: matchingHousekeepers,
      employerLocation: employer.location,
    });
  } catch (error) {
    console.error("Error getting matching housekeepers:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Employer selects housekeepers
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
      return res.status(400).json({ message: 'Employers can select up to 2 housekeepers only' });
    }

    // Validate all housekeeper IDs
    const validIds = housekeeperIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== housekeeperIds.length) {
      return res.status(400).json({ message: 'Invalid housekeeper ID(s) provided' });
    }

    // Check if all housekeepers exist and are available
    const housekeepers = await Housekeeper.find({
      _id: { $in: validIds },
      status: 'available'
    });

    if (housekeepers.length !== validIds.length) {
      return res.status(400).json({ 
        message: 'Some housekeepers are not found or not available' 
      });
    }

    const employer = await Employer.findByIdAndUpdate(
      id,
      { 
        $set: { 
          selectedHousekeepers: validIds,
          status: 'active'
        }
      },
      { new: true, runValidators: true }
    ).populate('selectedHousekeepers', 'fullName phoneNumber status location passportImage');

    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Update selected housekeepers status to hired
    await Housekeeper.updateMany(
      { _id: { $in: validIds } },
      { $set: { status: 'hired' } }
    );

    res.status(200).json({
      message: 'Housekeepers selected successfully',
      employer
    });
  } catch (error) {
    console.error('Error selecting housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update employer status (admin only)
export const updateEmployerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employer ID' });
    }

    if (!['pending', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, active, or completed' });
    }

    const employer = await Employer.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate('selectedHousekeepers', 'fullName phoneNumber status');

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

