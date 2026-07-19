import { Request, Response } from 'express';
import { z } from 'zod';
import {
  ADVERTISEMENT_PLACEMENTS,
  normalizeAdvertisementPlacement,
} from '../config/advertisement.config';
import { listPublicAdvertisements } from '../services/advertisement/advertisement.service';

const publicAdsQuerySchema = z.object({
  placement: z.string().trim().min(1, 'placement is required'),
});

export const listPublicAds = async (req: Request, res: Response) => {
  try {
    const parsed = publicAdsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message || 'Invalid query',
      });
    }

    const placement = normalizeAdvertisementPlacement(parsed.data.placement);
    if (!placement || !(ADVERTISEMENT_PLACEMENTS as readonly string[]).includes(placement)) {
      return res.status(400).json({
        message: `placement must be one of: ${ADVERTISEMENT_PLACEMENTS.join(', ')}`,
      });
    }

    const advertisements = await listPublicAdvertisements(placement);
    return res.status(200).json({ advertisements });
  } catch (error) {
    console.error('listPublicAds error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
