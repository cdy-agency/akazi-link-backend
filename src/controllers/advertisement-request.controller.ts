import { Request, Response } from 'express';
import {
  advertisementRequestSchema,
  listAdvertisementRequests,
  submitAdvertisementRequest,
  updateAdvertisementRequestStatus,
} from '../services/advertisement/advertisement-request.service';
import {
  ADVERTISEMENT_REQUEST_STATUSES,
  type AdvertisementRequestStatus,
} from '../models/AdvertisementRequest';
import { resolveAdvertisementMediaType } from '../config/advertisement.config';
import { parseSingleFile } from '../services/fileUploadService';
import { ZodError } from 'zod';

function validationError(res: Response, error: ZodError) {
  const message = error.issues[0]?.message || 'Validation failed';
  return res.status(400).json({ message });
}

export const createAdvertisementRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = advertisementRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    await submitAdvertisementRequest(parsed.data);
    res.status(201).json({
      message: 'Advertising request submitted successfully',
    });
  } catch (error) {
    console.error('createAdvertisementRequest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** Public upload for free ad requests — static images only (no GIF / video). */
export const uploadAdvertisementRequestMedia = async (
  req: Request,
  res: Response
) => {
  try {
    const file = parseSingleFile((req.body as { media?: unknown }).media);
    if (!file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const mediaType = resolveAdvertisementMediaType({
      mimeType: file.type,
      format: file.format,
      url: file.url,
    });

    if (mediaType !== 'IMAGE') {
      return res.status(400).json({
        message:
          'Free ad requests accept static images only (JPG, PNG, WEBP). For GIF or video ads, contact us on WhatsApp for Premium.',
      });
    }

    res.status(200).json({
      message: 'Media uploaded successfully',
      mediaType,
      mediaUrl: file.url,
      cloudinaryPublicId: file.public_id,
    });
  } catch (error) {
    console.error('uploadAdvertisementRequestMedia error:', error);
    res.status(500).json({ message: 'Server error during media upload' });
  }
};

export const listAdminAdvertisementRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const result = await listAdvertisementRequests({ status, page, limit });
    res.status(200).json(result);
  } catch (error) {
    console.error('listAdminAdvertisementRequests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminAdvertisementRequestStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const status = String(req.body?.status || '').toUpperCase();
    const adminNote =
      typeof req.body?.adminNote === 'string' ? req.body.adminNote : undefined;

    if (
      !(ADVERTISEMENT_REQUEST_STATUSES as readonly string[]).includes(status)
    ) {
      return res.status(400).json({
        message: 'Status must be APPROVED or REJECTED',
      });
    }

    const userId =
      (req as Request & { user?: { id?: string; _id?: string } }).user?.id ||
      (req as Request & { user?: { _id?: string } }).user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updated = await updateAdvertisementRequestStatus(id, {
      status: status as AdvertisementRequestStatus,
      adminNote,
      startDate: req.body?.startDate,
      endDate: req.body?.endDate,
      placement: req.body?.placement,
      createdBy: String(userId),
    });
    res.status(200).json({
      message: `Request ${status.toLowerCase()}`,
      item: updated,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || 500;
    if (statusCode >= 500) {
      console.error('updateAdminAdvertisementRequestStatus error:', error);
    }
    res.status(statusCode).json({
      message: error?.message || 'Server error',
    });
  }
};
