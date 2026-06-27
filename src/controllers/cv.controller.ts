/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { v2 as cloudinarySdk } from 'cloudinary';
import Employee from '../models/Employee';
import CvDocument from '../models/CvDocument';
import cloudinary from '../config/cloudinary';
import { parseSingleFile } from '../services/fileUploadService';
import { IFileInfo } from '../types/models';
import {
  CV_MAX_BYTES,
  getExtension,
  isRetryableParseStatus,
  normalizeParseStatus,
  resolveCvExtension,
  resolveCvMimeType,
} from '../config/cv.config';
import { scheduleCvProcessing } from '../services/cv-processing.service';
import { getCvExtractionSummary } from '../services/cv-extraction.service';

const validateCvFile = (file: IFileInfo): string => {
  if (!file.size || file.size > CV_MAX_BYTES) {
    throw Object.assign(new Error('CV file must be 10 MB or smaller'), {
      statusCode: 400,
    });
  }

  const extension = resolveCvExtension(file);
  if (!extension) {
    throw Object.assign(
      new Error('Only PDF, DOC, and DOCX files are allowed'),
      { statusCode: 400 }
    );
  }

  return extension;
};

const resolveCvFileName = (
  file: IFileInfo,
  extension: string,
  originalName?: string
): string => {
  const trimmedOriginal = originalName?.trim();
  if (trimmedOriginal) {
    return trimmedOriginal;
  }

  const fromName = file.name?.trim();
  if (fromName && getExtension(fromName)) {
    return fromName;
  }

  if (fromName) {
    return `${fromName}${extension}`;
  }

  return `cv${extension}`;
};

const destroyCloudinaryAsset = async (publicId?: string): Promise<void> => {
  if (!publicId) return;

  try {
    cloudinarySdk.config({
      cloud_name: cloudinary.cloudName,
      api_key: cloudinary.apiKey,
      api_secret: cloudinary.apiSecret,
    });
    await cloudinarySdk.uploader.destroy(publicId);
  } catch {
    // Ignore Cloudinary cleanup errors
  }
};

const getNextVersion = async (employeeId: string): Promise<number> => {
  const latest = await CvDocument.findOne({ employeeId })
    .sort({ version: -1 })
    .select('version')
    .lean();

  return (latest?.version ?? 0) + 1;
};

const createCvFromUpload = async (
  employeeId: string,
  file: IFileInfo,
  originalName?: string
) => {
  const extension = validateCvFile(file);

  const version = await getNextVersion(employeeId);

  const cv = await CvDocument.create({
    employeeId,
    fileName: resolveCvFileName(file, extension, originalName),
    fileUrl: file.url,
    fileSize: file.size,
    mimeType: resolveCvMimeType(extension, file.type),
    uploadedAt: new Date(),
    parseStatus: 'NOT_STARTED',
    rawText: undefined,
    processedAt: undefined,
    parseError: undefined,
    version,
    cloudinaryPublicId: file.public_id,
  });

  await Employee.findByIdAndUpdate(employeeId, { primaryCvId: cv._id });

  return cv;
};

const getPrimaryCv = async (employeeId: string) => {
  const employee = await Employee.findById(employeeId).select('primaryCvId');
  if (!employee?.primaryCvId) {
    return null;
  }

  return CvDocument.findById(employee.primaryCvId);
};

export const resolveEmployeePrimaryCv = getPrimaryCv;

const formatCvResponse = (cv: InstanceType<typeof CvDocument> | null) => {
  if (!cv) return null;

  return {
    id: cv._id,
    employeeId: cv.employeeId,
    fileName: cv.fileName,
    fileUrl: cv.fileUrl,
    fileSize: cv.fileSize,
    mimeType: cv.mimeType,
    uploadedAt: cv.uploadedAt,
    parseStatus: normalizeParseStatus(cv.parseStatus),
    processedAt: cv.processedAt,
    parseError: cv.parseError,
    version: cv.version,
    extractionMethod: cv.extractionMethod,
    extractionSummary: getCvExtractionSummary(cv.extractedData),
  };
};

const handleCvError = (res: Response, error: unknown) => {
  const statusCode = (error as { statusCode?: number })?.statusCode;
  const message = error instanceof Error ? error.message : 'Server error';

  if (statusCode) {
    return res.status(statusCode).json({ message });
  }

  console.error('CV operation error:', error);
  return res.status(500).json({ message: 'Server error' });
};

export const uploadCv = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const file = parseSingleFile((req.body as { cv?: unknown }).cv);
    if (!file) {
      return res.status(400).json({ message: 'No CV file uploaded' });
    }

    const cv = await createCvFromUpload(
      employeeId,
      file,
      req.file?.originalname
    );

    scheduleCvProcessing(String(cv._id));

    res.status(201).json({
      message: 'CV uploaded successfully. Processing has started.',
      cv: formatCvResponse(cv),
    });
  } catch (error) {
    return handleCvError(res, error);
  }
};

export const replaceCv = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const file = parseSingleFile((req.body as { cv?: unknown }).cv);
    if (!file) {
      return res.status(400).json({ message: 'No CV file uploaded' });
    }

    const cv = await createCvFromUpload(
      employeeId,
      file,
      req.file?.originalname
    );

    scheduleCvProcessing(String(cv._id));

    res.status(200).json({
      message: 'CV replaced successfully. Processing has started.',
      cv: formatCvResponse(cv),
    });
  } catch (error) {
    return handleCvError(res, error);
  }
};

export const getCv = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const cv = await getPrimaryCv(employeeId);

    res.status(200).json({
      message: cv ? 'CV retrieved successfully' : 'No CV on file',
      cv: formatCvResponse(cv),
    });
  } catch (error) {
    return handleCvError(res, error);
  }
};

export const deleteCv = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const cv = await getPrimaryCv(employeeId);
    if (!cv) {
      return res.status(404).json({ message: 'No CV found to delete' });
    }

    await destroyCloudinaryAsset(cv.cloudinaryPublicId);
    await CvDocument.findByIdAndDelete(cv._id);
    await Employee.findByIdAndUpdate(employeeId, { primaryCvId: null });

    res.status(200).json({ message: 'CV deleted successfully', cv: null });
  } catch (error) {
    return handleCvError(res, error);
  }
};

export const retryCvProcessing = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const cv = await getPrimaryCv(employeeId);
    if (!cv) {
      return res.status(404).json({ message: 'No CV found' });
    }

    if (!isRetryableParseStatus(cv.parseStatus)) {
      return res.status(400).json({
        message: 'CV processing can only be retried when status is FAILED',
      });
    }

    scheduleCvProcessing(String(cv._id));

    const refreshed = await getPrimaryCv(employeeId);

    res.status(202).json({
      message: 'CV processing retry started',
      cv: formatCvResponse(refreshed),
    });
  } catch (error) {
    return handleCvError(res, error);
  }
};

export const downloadCv = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const cv = await getPrimaryCv(employeeId);
    if (!cv) {
      return res.status(404).json({ message: 'No CV found to download' });
    }

    res.status(200).json({
      message: 'CV download ready',
      download: {
        url: cv.fileUrl,
        fileName: cv.fileName,
        mimeType: cv.mimeType,
      },
    });
  } catch (error) {
    return handleCvError(res, error);
  }
};
