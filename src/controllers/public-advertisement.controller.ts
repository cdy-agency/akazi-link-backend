import { Request, Response } from 'express';
import { z } from 'zod';
import {
  ADVERTISEMENT_PLACEMENTS,
  normalizeAdvertisementPlacement,
} from '../config/advertisement.config';
import {
  getPublicAdvertisementById,
  listPublicAdvertisements,
  recordAdvertisementView,
} from '../services/advertisement/advertisement.service';

const publicAdsQuerySchema = z.object({
  placement: z.string().trim().optional(),
});

const recordViewBodySchema = z.object({
  viewerKey: z.string().trim().min(8).max(200),
});

export const listPublicAds = async (req: Request, res: Response) => {
  try {
    const parsed = publicAdsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message || 'Invalid query',
      });
    }

    const rawPlacement = parsed.data.placement?.trim();
    let placement: ReturnType<typeof normalizeAdvertisementPlacement> | undefined;

    if (rawPlacement && rawPlacement.toUpperCase() !== 'ALL') {
      placement = normalizeAdvertisementPlacement(rawPlacement);
      if (
        !placement ||
        !(ADVERTISEMENT_PLACEMENTS as readonly string[]).includes(placement)
      ) {
        return res.status(400).json({
          message: `placement must be one of: ${ADVERTISEMENT_PLACEMENTS.join(', ')}, ALL`,
        });
      }
    }

    const advertisements = await listPublicAdvertisements(
      placement || undefined
    );
    return res.status(200).json({ advertisements });
  } catch (error) {
    console.error('listPublicAds error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicAdById = async (req: Request, res: Response) => {
  try {
    const advertisement = await getPublicAdvertisementById(req.params.id);
    return res.status(200).json({ advertisement });
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = (error as { message?: string })?.message || 'Server error';
    if (statusCode >= 500) {
      console.error('getPublicAdById error:', error);
    }
    return res.status(statusCode).json({ message });
  }
};

export const recordPublicAdView = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = recordViewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message || 'viewerKey is required',
      });
    }

    const result = await recordAdvertisementView(id, parsed.data.viewerKey);
    return res.status(200).json({
      message: result.counted
        ? 'View recorded'
        : 'View already counted for this viewer',
      ...result,
    });
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = (error as { message?: string })?.message || 'Server error';
    if (statusCode >= 500) {
      console.error('recordPublicAdView error:', error);
    }
    return res.status(statusCode).json({ message });
  }
};
