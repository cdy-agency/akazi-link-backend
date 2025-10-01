/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import Housekeeper from '../models/Housekeeper';
import { Types } from 'mongoose';
import { parseSingleFile } from '../services/fileUploadService';

export const registerHousekeeper = async (req: any, res: any) => {
  try {
    const body: any = req.body;

    const passportImage = parseSingleFile(body.passportImage);
    const fullBodyImage = parseSingleFile(body.fullBodyImage);

    const hk = await Housekeeper.create({
      fullName: body.fullName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      gender: body.gender,
      idNumber: body.idNumber,
      phoneNumber: body.phoneNumber,
      location: {
        province: body?.location?.province || body.province,
        district: body?.location?.district || body.district,
        sector: body?.location?.sector || body.sector,
        cell: body?.location?.cell || body.cell,
        village: body?.location?.village || body.village,
      },
      workPreferences: {
        workDistrict: body?.workPreferences?.workDistrict || body.workDistrict,
        workSector: body?.workPreferences?.workSector || body.workSector,
        willingToWorkWithChildren: typeof (body?.workPreferences?.willingToWorkWithChildren ?? body.willingToWorkWithChildren) === 'boolean'
          ? (body?.workPreferences?.willingToWorkWithChildren ?? body.willingToWorkWithChildren)
          : undefined,
      },
      background: {
        hasParents: typeof (body?.background?.hasParents ?? body.hasParents) === 'boolean'
          ? (body?.background?.hasParents ?? body.hasParents)
          : undefined,
        fatherName: body?.background?.fatherName || body.fatherName,
        fatherPhone: body?.background?.fatherPhone || body.fatherPhone,
        motherName: body?.background?.motherName || body.motherName,
        motherPhone: body?.background?.motherPhone || body.motherPhone,
        hasStudied: typeof (body?.background?.hasStudied ?? body.hasStudied) === 'boolean'
          ? (body?.background?.hasStudied ?? body.hasStudied)
          : undefined,
        educationLevel: body?.background?.educationLevel || body.educationLevel,
        church: body?.background?.church || body.church,
      },
      ...(passportImage ? { passportImage } : {}),
      ...(fullBodyImage ? { fullBodyImage } : {}),
    });

    res.status(201).json({ message: 'Housekeeper created successfully', housekeeper: hk });
  } catch (error) {
    console.error('Error registering housekeeper:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listHousekeepers = async (_req: any, res: any) => {
  try {
    const housekeepers = await Housekeeper.find().sort({ createdAt: -1 });
    res.status(200).json({ message: 'Housekeepers retrieved successfully', housekeepers });
  } catch (error) {
    console.error('Error listing housekeepers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getHousekeeperById = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid housekeeper id' });
    const hk = await Housekeeper.findById(id);
    if (!hk) return res.status(404).json({ message: 'Housekeeper not found' });
    res.status(200).json({ message: 'Housekeeper retrieved successfully', housekeeper: hk });
  } catch (error) {
    console.error('Error getting housekeeper:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateHousekeeper = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid housekeeper id' });

    const body: any = req.body;
    const set: any = { ...body };

    if (body.location || body.province) {
      set.location = {
        province: body?.location?.province || body.province,
        district: body?.location?.district || body.district,
        sector: body?.location?.sector || body.sector,
        cell: body?.location?.cell || body.cell,
        village: body?.location?.village || body.village,
      };
    }

    if (body.workPreferences || body.workDistrict || body.workSector || typeof body.willingToWorkWithChildren !== 'undefined') {
      set.workPreferences = {
        workDistrict: body?.workPreferences?.workDistrict || body.workDistrict,
        workSector: body?.workPreferences?.workSector || body.workSector,
        willingToWorkWithChildren: typeof (body?.workPreferences?.willingToWorkWithChildren ?? body.willingToWorkWithChildren) === 'boolean'
          ? (body?.workPreferences?.willingToWorkWithChildren ?? body.willingToWorkWithChildren)
          : undefined,
      };
    }

    if (body.background || typeof body.hasParents !== 'undefined' || body.fatherName || body.motherName) {
      set.background = {
        hasParents: typeof (body?.background?.hasParents ?? body.hasParents) === 'boolean'
          ? (body?.background?.hasParents ?? body.hasParents)
          : undefined,
        fatherName: body?.background?.fatherName || body.fatherName,
        fatherPhone: body?.background?.fatherPhone || body.fatherPhone,
        motherName: body?.background?.motherName || body.motherName,
        motherPhone: body?.background?.motherPhone || body.motherPhone,
        hasStudied: typeof (body?.background?.hasStudied ?? body.hasStudied) === 'boolean'
          ? (body?.background?.hasStudied ?? body.hasStudied)
          : undefined,
        educationLevel: body?.background?.educationLevel || body.educationLevel,
        church: body?.background?.church || body.church,
      };
    }

    const passportImage = parseSingleFile(body.passportImage);
    if (passportImage) set.passportImage = passportImage;
    const fullBodyImage = parseSingleFile(body.fullBodyImage);
    if (fullBodyImage) set.fullBodyImage = fullBodyImage;

    const hk = await Housekeeper.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, runValidators: true }
    );
    if (!hk) return res.status(404).json({ message: 'Housekeeper not found' });
    res.status(200).json({ message: 'Housekeeper updated successfully', housekeeper: hk });
  } catch (error) {
    console.error('Error updating housekeeper:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteHousekeeper = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid housekeeper id' });
    const deleted = await Housekeeper.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Housekeeper not found' });
    res.status(200).json({ message: 'Housekeeper deleted successfully' });
  } catch (error) {
    console.error('Error deleting housekeeper:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

