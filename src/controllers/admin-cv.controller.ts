/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import CvDocument from '../models/CvDocument';
import {
  isProcessingParseStatus,
  isRetryableParseStatus,
  normalizeParseStatus,
} from '../config/cv.config';
import {
  getCvProcessingSummary,
  scheduleCvProcessing,
} from '../services/cv-processing.service';
import { normalizeExtractedData } from '../services/cv-extraction.service';
import { getEmployeeReviewFields } from '../services/cv-profile-review.service';

const EMPLOYEE_FIELDS =
  'name email profileReviewStatus profileApprovedAt';

const formatAdminCv = (cv: InstanceType<typeof CvDocument>) => {
  const employee = cv.employeeId as
    | {
        _id?: Types.ObjectId;
        name?: string;
        email?: string;
        profileReviewStatus?: string;
        profileApprovedAt?: Date;
      }
    | Types.ObjectId
    | undefined;

  const candidate =
    employee && typeof employee === 'object' && 'name' in employee
      ? {
          id: employee._id,
          name: employee.name || 'Unknown',
          email: employee.email,
          ...getEmployeeReviewFields(employee),
        }
      : { id: employee, name: 'Unknown', ...getEmployeeReviewFields(null) };

  return {
    id: cv._id,
    employeeId: cv.employeeId,
    candidate,
    fileName: cv.fileName,
    fileUrl: cv.fileUrl,
    fileSize: cv.fileSize,
    mimeType: cv.mimeType,
    uploadedAt: cv.uploadedAt,
    version: cv.version,
    ...getCvProcessingSummary(cv),
    rawText: cv.rawText,
    extractedData: normalizeExtractedData(cv.extractedData),
    confidenceScores: cv.confidenceScores,
    aiProvider: cv.aiProvider,
  };
};

const loadPopulatedCv = async (id: string) =>
  CvDocument.findById(id).populate('employeeId', EMPLOYEE_FIELDS);

export const listAdminCvs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;
    const statusFilter =
      typeof req.query.status === 'string' ? req.query.status : undefined;

    const filter: Record<string, unknown> = {};
    if (statusFilter) {
      const normalized = normalizeParseStatus(statusFilter);
      filter.parseStatus = {
        $in: [
          normalized,
          normalized.toLowerCase(),
          normalized === 'PROCESSING' ? 'pending' : undefined,
          normalized === 'NOT_STARTED' ? 'not_started' : undefined,
          normalized === 'COMPLETED' ? 'completed' : undefined,
          normalized === 'FAILED' ? 'failed' : undefined,
        ].filter(Boolean),
      };
    }

    const [cvs, total] = await Promise.all([
      CvDocument.find(filter)
        .populate('employeeId', EMPLOYEE_FIELDS)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit),
      CvDocument.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      message: 'CV documents retrieved successfully',
      cvs: cvs.map(formatAdminCv),
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
    console.error('Error listing admin CVs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminCvById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid CV ID' });
    }

    const cv = await loadPopulatedCv(id);

    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    res.status(200).json({
      message: 'CV retrieved successfully',
      cv: formatAdminCv(cv),
    });
  } catch (error) {
    console.error('Error getting admin CV:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const retryAdminCv = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid CV ID' });
    }

    const cv = await CvDocument.findById(id);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    if (!isRetryableParseStatus(cv.parseStatus)) {
      return res.status(400).json({
        message: 'CV processing can only be retried when status is FAILED',
      });
    }

    if (isProcessingParseStatus(cv.parseStatus)) {
      return res.status(409).json({ message: 'CV is already processing' });
    }

    scheduleCvProcessing(id);

    const populated = await loadPopulatedCv(id);

    res.status(202).json({
      message: 'CV processing retry started',
      cv: formatAdminCv(populated!),
    });
  } catch (error) {
    console.error('Error retrying admin CV processing:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const reprocessAdminCv = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid CV ID' });
    }

    const cv = await CvDocument.findById(id);
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    if (isProcessingParseStatus(cv.parseStatus)) {
      return res.status(409).json({ message: 'CV is already processing' });
    }

    scheduleCvProcessing(id);

    const populated = await loadPopulatedCv(id);

    res.status(202).json({
      message: 'CV reprocessing started',
      cv: formatAdminCv(populated!),
    });
  } catch (error) {
    console.error('Error reprocessing admin CV:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
