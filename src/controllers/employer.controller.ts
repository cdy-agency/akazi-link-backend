/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Employer from '../models/Employer';
import Housekeeper from '../models/Housekeeper';
import { Types } from 'mongoose';
import { parseSingleFile } from '../services/fileUploadService';

export const registerEmployer = async (req: any, res: any) => {
  try {
    const body: any = req.body;

    const profileImage = parseSingleFile(body.profileImage);

    const employer = await Employer.create({
      name: body.name,
      email: body.email,
      nationalId: body.nationalId,
      location: {
        province: body?.location?.province || body.province,
        district: body?.location?.district || body.district,
        sector: body?.location?.sector || body.sector,
        cell: body?.location?.cell || body.cell,
        village: body?.location?.village || body.village,
      },
      villageLeaderNumber: body.villageLeaderNumber,
      partnerNumber: body.partnerNumber,
      churchName: body.churchName,
      salaryRangeMin: body.salaryRangeMin,
      salaryRangeMax: body.salaryRangeMax,
      ...(profileImage ? { profileImage } : {}),
    });

    res.status(201).json({ message: 'Employer created successfully', employer });
  } catch (error) {
    console.error('Error registering employer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listEmployers = async (_req: any, res: any) => {
  try {
    const employers = await Employer.find().sort({ createdAt: -1 });
    res.status(200).json({ message: 'Employers retrieved successfully', employers });
  } catch (error) {
    console.error('Error listing employers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEmployerById = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid employer id' });
    const employer = await Employer.findById(id);
    if (!employer) return res.status(404).json({ message: 'Employer not found' });
    res.status(200).json({ message: 'Employer retrieved successfully', employer });
  } catch (error) {
    console.error('Error getting employer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateEmployer = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid employer id' });

    const body: any = req.body;
    const set: any = { ...body };

    // Normalize location
    if (body.location || body.province) {
      set.location = {
        province: body?.location?.province || body.province,
        district: body?.location?.district || body.district,
        sector: body?.location?.sector || body.sector,
        cell: body?.location?.cell || body.cell,
        village: body?.location?.village || body.village,
      };
    }

    // Incoming profile image via upload service
    const profileImage = parseSingleFile(body.profileImage);
    if (profileImage) set.profileImage = profileImage;

    const employer = await Employer.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, runValidators: true }
    );
    if (!employer) return res.status(404).json({ message: 'Employer not found' });
    res.status(200).json({ message: 'Employer updated successfully', employer });
  } catch (error) {
    console.error('Error updating employer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEmployer = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid employer id' });
    const deleted = await Employer.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Employer not found' });
    res.status(200).json({ message: 'Employer deleted successfully' });
  } catch (error) {
    console.error('Error deleting employer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEmployerMatches = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid employer id' });

    const employer = await Employer.findById(id);
    if (!employer) return res.status(404).json({ message: 'Employer not found' });

    const { sector, cell, village } = employer.location as any;
    const salaryMin = employer.salaryRangeMin;
    const salaryMax = employer.salaryRangeMax;

    const query: any = {
      'location.sector': sector,
      'location.cell': cell,
      'location.village': village,
      status: { $ne: 'hired' },
    };

    // Future: if housekeepers had salary expectation, we could match; currently omitted.
    const matches = await Housekeeper.find(query).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Matching housekeepers retrieved', matches });
  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const selectHousekeepers = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    const { housekeeperIds } = req.body as { housekeeperIds: string[] };

    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid employer id' });
    if (!Array.isArray(housekeeperIds)) return res.status(400).json({ message: 'housekeeperIds must be an array' });

    const uniqueIds = [...new Set(housekeeperIds)].filter((x) => Types.ObjectId.isValid(x));
    if (uniqueIds.length === 0) return res.status(400).json({ message: 'No valid housekeeper ids provided' });
    if (uniqueIds.length > 2) return res.status(400).json({ message: 'You can only select up to 2 housekeepers' });

    const employer = await Employer.findById(id);
    if (!employer) return res.status(404).json({ message: 'Employer not found' });

    employer.selectedHousekeepers = uniqueIds.map((x) => new Types.ObjectId(x));
    await employer.save();

    const selected = await Housekeeper.find({ _id: { $in: uniqueIds } });
    res.status(200).json({ message: 'Selection saved', selectedHousekeepers: selected });
  } catch (error) {
    console.error('Error selecting housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

