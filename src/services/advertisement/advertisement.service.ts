import { Types } from 'mongoose';
import { createHash } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import Advertisement from '../../models/Advertisement';
import { AdvertisementViewEvent } from '../../models/AdvertisementViewEvent';
import {
  ADVERTISEMENT_PLACEMENT_LIMITS,
  ADVERTISEMENT_VIEW_DEDUPE_HOURS,
  ADVERTISEMENT_VIEWS_PER_IMPRESSION,
  AdvertisementPlacement,
  computeAdvertisementStatus,
  normalizeAdvertisementPlacement,
} from '../../config/advertisement.config';
import type {
  AdvertisementListQuery,
  CreateAdvertisementInput,
  DuplicateAdvertisementInput,
  UpdateAdvertisementInput,
} from '../../validators/advertisement.validator';

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function emptyToUndefined(value?: string | null) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

function placementFilterValues(placement: AdvertisementPlacement): string[] {
  if (placement === 'TOPBAR') return ['TOPBAR', 'SIDEBAR'];
  if (placement === 'HOME_SECTION') return ['HOME_SECTION', 'HOMEPAGE'];
  return [placement];
}

function serializeAd<T extends {
  placement?: string;
  status?: string;
  startDate: Date;
  endDate: Date;
}>(item: T, now: Date = new Date()) {
  const placement =
    normalizeAdvertisementPlacement(String(item.placement || '')) ||
    (item.placement as AdvertisementPlacement);

  // Manual draft stays draft until admin republishes
  if (item.status === 'DRAFT') {
    return { ...item, placement, status: 'DRAFT' as const };
  }

  return {
    ...item,
    placement,
    status: computeAdvertisementStatus(
      new Date(item.startDate),
      new Date(item.endDate),
      now
    ),
  };
}

function buildStatusDateFilter(status: string, now: Date) {
  if (status === 'SCHEDULED') {
    return {
      status: { $ne: 'DRAFT' },
      startDate: { $gt: now },
    };
  }
  if (status === 'PUBLISHED') {
    return {
      status: { $ne: 'DRAFT' },
      startDate: { $lte: now },
      endDate: { $gte: now },
    };
  }
  if (status === 'EXPIRED') {
    return {
      status: { $ne: 'DRAFT' },
      endDate: { $lt: now },
    };
  }
  if (status === 'DRAFT') {
    return { status: 'DRAFT' };
  }
  return {};
}

/**
 * Count SCHEDULED + PUBLISHED ads for a placement (slots that occupy capacity).
 * Drafts do not consume slots.
 */
async function countActiveAdsForPlacement(
  placement: AdvertisementPlacement,
  excludeId?: string
) {
  const now = new Date();
  const filter: Record<string, unknown> = {
    placement: { $in: placementFilterValues(placement) },
    status: { $ne: 'DRAFT' },
    endDate: { $gte: now },
  };
  if (excludeId && Types.ObjectId.isValid(excludeId)) {
    filter._id = { $ne: new Types.ObjectId(excludeId) };
  }
  return Advertisement.countDocuments(filter);
}

async function assertPlacementCapacity(
  placement: AdvertisementPlacement,
  resultingStatus: string,
  excludeId?: string
) {
  const limit = ADVERTISEMENT_PLACEMENT_LIMITS[placement];
  if (!limit) return;
  if (resultingStatus !== 'SCHEDULED' && resultingStatus !== 'PUBLISHED') {
    return;
  }

  const count = await countActiveAdsForPlacement(placement, excludeId);
  if (count >= limit) {
    const label = placement === 'TOPBAR' ? 'Navbar / Topbar' : placement;
    throw httpError(
      `You can't post more than ${limit} ads for ${label}. Select another placement or delete one.`,
      400
    );
  }
}

export async function listAdvertisements(query: AdvertisementListQuery) {
  const now = new Date();
  const filter: Record<string, unknown> = {};

  if (query.placement) {
    filter.placement = { $in: placementFilterValues(query.placement) };
  }
  if (query.mediaType) filter.mediaType = query.mediaType;
  if (query.q?.trim()) {
    filter.title = {
      $regex: query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    };
  }
  if (query.status) {
    Object.assign(filter, buildStatusDateFilter(query.status, now));
  }

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    Advertisement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'email role')
      .lean(),
    Advertisement.countDocuments(filter),
  ]);

  const items = rawItems.map((item) => serializeAd(item, now));

  return { items, total, page, limit };
}

export async function listPublicAdvertisements(
  placement?: AdvertisementPlacement | null
) {
  const now = new Date();
  // Gallery (no placement) and home section can show many; slot placements stay capped.
  const limit =
    !placement ? 48 : placement === 'HOME_SECTION' ? 12 : 2;

  const filter: Record<string, unknown> = {
    status: { $ne: 'DRAFT' },
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: { $ne: false },
  };

  if (placement) {
    filter.placement = { $in: placementFilterValues(placement) };
  }

  const items = await Advertisement.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      'title description mediaType mediaUrl placement buttonText buttonLink startDate endDate status viewCount'
    )
    .lean();

  return items.map((item) => serializeAd(item, now));
}

/** Public detail — only currently live (non-draft, in schedule) ads. */
export async function getPublicAdvertisementById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw httpError('Advertisement not found', 404);
  }

  const now = new Date();
  const ad = await Advertisement.findOne({
    _id: id,
    status: { $ne: 'DRAFT' },
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: { $ne: false },
  })
    .select(
      'title description mediaType mediaUrl placement buttonText buttonLink startDate endDate status viewCount'
    )
    .lean();

  if (!ad) {
    throw httpError('Advertisement not found', 404);
  }

  return serializeAd(ad, now);
}

export async function getAdvertisementById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw httpError('Advertisement not found', 404);
  }

  const ad = await Advertisement.findById(id)
    .populate('createdBy', 'email role')
    .lean();

  if (!ad) {
    throw httpError('Advertisement not found', 404);
  }

  return serializeAd(ad);
}

export async function createAdvertisement(
  input: CreateAdvertisementInput,
  createdBy: string
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const status = computeAdvertisementStatus(startDate, endDate);
  const placement = normalizeAdvertisementPlacement(input.placement) || input.placement;

  await assertPlacementCapacity(placement, status);

  const ad = await Advertisement.create({
    title: input.title.trim(),
    description: emptyToUndefined(input.description),
    mediaType: input.mediaType,
    mediaUrl: input.mediaUrl,
    cloudinaryPublicId: emptyToUndefined(input.cloudinaryPublicId),
    placement,
    buttonText: emptyToUndefined(input.buttonText),
    buttonLink: emptyToUndefined(input.buttonLink),
    startDate,
    endDate,
    status,
    createdBy,
  });

  return serializeAd(ad.toObject());
}

export async function updateAdvertisement(
  id: string,
  input: UpdateAdvertisementInput
) {
  if (!Types.ObjectId.isValid(id)) {
    throw httpError('Advertisement not found', 404);
  }

  const ad = await Advertisement.findById(id);
  if (!ad) {
    throw httpError('Advertisement not found', 404);
  }

  const previousPublicId = ad.cloudinaryPublicId;

  if (input.title !== undefined) ad.title = input.title.trim();
  if (input.description !== undefined) {
    ad.description = emptyToUndefined(input.description) || undefined;
  }
  if (input.mediaType !== undefined) ad.mediaType = input.mediaType;
  if (input.mediaUrl !== undefined) ad.mediaUrl = input.mediaUrl;
  if (input.cloudinaryPublicId !== undefined) {
    ad.cloudinaryPublicId =
      emptyToUndefined(input.cloudinaryPublicId) || undefined;
  }
  if (input.placement !== undefined) {
    ad.placement =
      normalizeAdvertisementPlacement(input.placement) || input.placement;
  }
  if (input.buttonText !== undefined) {
    ad.buttonText = emptyToUndefined(input.buttonText) || undefined;
  }
  if (input.buttonLink !== undefined) {
    ad.buttonLink = emptyToUndefined(input.buttonLink) || undefined;
  }
  if (input.startDate !== undefined) ad.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) ad.endDate = new Date(input.endDate);

  if (ad.endDate.getTime() <= ad.startDate.getTime()) {
    throw httpError('End date must be greater than start date', 400);
  }

  const placement =
    normalizeAdvertisementPlacement(String(ad.placement)) ||
    (ad.placement as AdvertisementPlacement);
  ad.placement = placement;

  // Manual draft / republish
  if (input.status === 'DRAFT') {
    ad.status = 'DRAFT';
  } else if (input.status === 'PUBLISHED') {
    ad.status = computeAdvertisementStatus(ad.startDate, ad.endDate);
    await assertPlacementCapacity(placement, ad.status, id);
  } else if (ad.status === 'DRAFT') {
    // Keep draft when editing other fields; do not auto-publish
    ad.status = 'DRAFT';
  } else {
    ad.status = computeAdvertisementStatus(ad.startDate, ad.endDate);
    await assertPlacementCapacity(placement, ad.status, id);
  }

  await ad.save();

  if (
    input.mediaUrl !== undefined &&
    previousPublicId &&
    previousPublicId !== ad.cloudinaryPublicId
  ) {
    try {
      await cloudinary.uploader.destroy(previousPublicId, {
        resource_type: 'auto',
      });
    } catch (error) {
      console.error('Failed to destroy previous advertisement media:', error);
    }
  }

  return serializeAd(ad.toObject());
}

/**
 * Clone an ad into another placement (same media/schedule) so one creative
 * can appear in more than one landing slot.
 */
export async function duplicateAdvertisement(
  id: string,
  input: DuplicateAdvertisementInput,
  createdBy: string
) {
  if (!Types.ObjectId.isValid(id)) {
    throw httpError('Advertisement not found', 404);
  }

  const source = await Advertisement.findById(id).lean();
  if (!source) {
    throw httpError('Advertisement not found', 404);
  }

  const placement =
    normalizeAdvertisementPlacement(input.placement) || input.placement;
  const startDate = new Date(source.startDate);
  const endDate = new Date(source.endDate);
  const status =
    source.status === 'DRAFT'
      ? 'DRAFT'
      : computeAdvertisementStatus(startDate, endDate);

  if (status !== 'DRAFT') {
    await assertPlacementCapacity(placement, status);
  }

  const titleBase = (input.title?.trim() || source.title || 'Advertisement').trim();
  const title =
    titleBase.length > 190 ? `${titleBase.slice(0, 190)} (copy)` : `${titleBase} (copy)`;

  const ad = await Advertisement.create({
    title,
    description: source.description,
    mediaType: source.mediaType,
    mediaUrl: source.mediaUrl,
    // Do not copy cloudinaryPublicId — deleting this copy must not remove original media
    cloudinaryPublicId: undefined,
    placement,
    buttonText: source.buttonText,
    buttonLink: source.buttonLink,
    startDate,
    endDate,
    status,
    createdBy,
    isActive: source.isActive !== false,
    viewCount: 0,
  });

  return serializeAd(ad.toObject());
}

export async function deleteAdvertisement(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw httpError('Advertisement not found', 404);
  }

  const ad = await Advertisement.findById(id);
  if (!ad) {
    throw httpError('Advertisement not found', 404);
  }

  const publicId = ad.cloudinaryPublicId;
  await ad.deleteOne();

  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    } catch (error) {
      console.error('Failed to destroy advertisement media:', error);
    }
  }

  return { deleted: true };
}

function hashViewerKey(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Records one unique client impression as +50 views.
 * Returns counted=false when the same viewer already contributed within the window.
 */
export async function recordAdvertisementView(
  id: string,
  viewerKeyRaw: string
) {
  if (!Types.ObjectId.isValid(id)) {
    throw httpError('Advertisement not found', 404);
  }

  const key = String(viewerKeyRaw || '').trim();
  if (key.length < 8 || key.length > 200) {
    throw httpError('Invalid viewer key', 400);
  }

  const now = new Date();
  const ad = await Advertisement.findById(id).lean();
  if (!ad || ad.isActive === false) {
    throw httpError('Advertisement not found', 404);
  }

  const liveStatus =
    ad.status === 'DRAFT'
      ? 'DRAFT'
      : computeAdvertisementStatus(
          new Date(ad.startDate),
          new Date(ad.endDate),
          now
        );

  if (liveStatus !== 'PUBLISHED') {
    throw httpError('Advertisement is not currently published', 400);
  }

  const viewerKey = hashViewerKey(`${id}:${key}`);
  const expiresAt = new Date(
    now.getTime() + ADVERTISEMENT_VIEW_DEDUPE_HOURS * 60 * 60 * 1000
  );

  try {
    await AdvertisementViewEvent.create({
      advertisementId: ad._id,
      viewerKey,
      expiresAt,
    });
  } catch (error: unknown) {
    const code = (error as { code?: number })?.code;
    // Duplicate key → already counted for this viewer/ad window
    if (code === 11000) {
      return {
        counted: false,
        viewsAdded: 0,
        viewCount: ad.viewCount ?? 0,
      };
    }
    throw error;
  }

  const updated = await Advertisement.findByIdAndUpdate(
    id,
    { $inc: { viewCount: ADVERTISEMENT_VIEWS_PER_IMPRESSION } },
    { new: true }
  )
    .select('viewCount')
    .lean();

  return {
    counted: true,
    viewsAdded: ADVERTISEMENT_VIEWS_PER_IMPRESSION,
    viewCount: updated?.viewCount ?? (ad.viewCount ?? 0) + ADVERTISEMENT_VIEWS_PER_IMPRESSION,
  };
}
