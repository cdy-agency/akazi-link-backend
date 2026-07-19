import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { parseSingleFile } from '../services/fileUploadService';
import {
  resolveAdvertisementMediaType,
} from '../config/advertisement.config';
import {
  advertisementListQuerySchema,
  createAdvertisementSchema,
  duplicateAdvertisementSchema,
  updateAdvertisementSchema,
} from '../validators/advertisement.validator';
import {
  createAdvertisement,
  deleteAdvertisement,
  duplicateAdvertisement,
  getAdvertisementById,
  listAdvertisements,
  updateAdvertisement,
} from '../services/advertisement/advertisement.service';

function validationError(res: Response, error: ZodError) {
  const message = error.issues[0]?.message || 'Validation failed';
  return res.status(400).json({ message });
}

function handleServiceError(res: Response, error: unknown, label: string) {
  const err = error as { statusCode?: number; message?: string };
  const status = err?.statusCode || 500;
  if (status >= 500) {
    console.error(`${label} error:`, error);
  }
  return res.status(status).json({
    message: err?.message || 'Server error',
  });
}

export const listAdminAdvertisements = async (req: Request, res: Response) => {
  try {
    const parsed = advertisementListQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error);
    const result = await listAdvertisements(parsed.data);
    res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error, 'listAdminAdvertisements');
  }
};

export const getAdminAdvertisementById = async (req: Request, res: Response) => {
  try {
    const advertisement = await getAdvertisementById(req.params.id);
    res.status(200).json({ advertisement });
  } catch (error) {
    return handleServiceError(res, error, 'getAdminAdvertisementById');
  }
};

export const createAdminAdvertisement = async (req: Request, res: Response) => {
  try {
    const parsed = createAdvertisementSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const userId =
      (req as Request & { user?: { id?: string; _id?: string } }).user?.id ||
      (req as Request & { user?: { _id?: string } }).user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const advertisement = await createAdvertisement(parsed.data, String(userId));
    res.status(201).json({ advertisement });
  } catch (error) {
    return handleServiceError(res, error, 'createAdminAdvertisement');
  }
};

export const updateAdminAdvertisement = async (req: Request, res: Response) => {
  try {
    const parsed = updateAdvertisementSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const advertisement = await updateAdvertisement(req.params.id, parsed.data);
    res.status(200).json({ advertisement });
  } catch (error) {
    return handleServiceError(res, error, 'updateAdminAdvertisement');
  }
};

export const deleteAdminAdvertisement = async (req: Request, res: Response) => {
  try {
    await deleteAdvertisement(req.params.id);
    res.status(200).json({ message: 'Advertisement deleted' });
  } catch (error) {
    return handleServiceError(res, error, 'deleteAdminAdvertisement');
  }
};

export const duplicateAdminAdvertisement = async (req: Request, res: Response) => {
  try {
    const parsed = duplicateAdvertisementSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const userId =
      (req as Request & { user?: { id?: string; _id?: string } }).user?.id ||
      (req as Request & { user?: { _id?: string } }).user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const advertisement = await duplicateAdvertisement(
      req.params.id,
      parsed.data,
      String(userId)
    );
    res.status(201).json({ advertisement });
  } catch (error) {
    return handleServiceError(res, error, 'duplicateAdminAdvertisement');
  }
};

export const uploadAdminAdvertisementMedia = async (
  req: Request,
  res: Response
) => {
  try {
    const file = parseSingleFile((req.body as { media?: unknown }).media);
    if (!file) {
      return res.status(400).json({ message: 'No media file uploaded' });
    }

    const mediaType = resolveAdvertisementMediaType({
      mimeType: file.type,
      format: file.format,
      url: file.url,
    });

    if (!mediaType) {
      return res.status(400).json({
        message: 'Unsupported media format. Upload an image, GIF, or video.',
      });
    }

    res.status(200).json({
      message: 'Media uploaded successfully',
      file,
      mediaType,
      mediaUrl: file.url,
      cloudinaryPublicId: file.public_id,
    });
  } catch (error) {
    console.error('uploadAdminAdvertisementMedia error:', error);
    res.status(500).json({ message: 'Server error during media upload' });
  }
};
