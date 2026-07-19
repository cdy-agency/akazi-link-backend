export const ADVERTISEMENT_PLACEMENTS = [
  'HERO',
  'HOME_SECTION',
  'TOPBAR',
  'FOOTER',
] as const;
export type AdvertisementPlacement = (typeof ADVERTISEMENT_PLACEMENTS)[number];

/** Legacy values kept only for reading old DB documents. */
export const LEGACY_ADVERTISEMENT_PLACEMENTS = ['SIDEBAR', 'HOMEPAGE'] as const;

export const ADVERTISEMENT_MEDIA_TYPES = ['IMAGE', 'GIF', 'VIDEO'] as const;
export type AdvertisementMediaType = (typeof ADVERTISEMENT_MEDIA_TYPES)[number];

export const ADVERTISEMENT_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'EXPIRED',
] as const;
export type AdvertisementStatus = (typeof ADVERTISEMENT_STATUSES)[number];

/** Max concurrent non-expired ads allowed per placement (HERO + TOPBAR). */
export const ADVERTISEMENT_PLACEMENT_LIMITS: Partial<
  Record<AdvertisementPlacement, number>
> = {
  HERO: 2,
  TOPBAR: 2,
  FOOTER: 2,
};

export function normalizeAdvertisementPlacement(
  value: string
): AdvertisementPlacement | null {
  const upper = value.toUpperCase();
  if (upper === 'SIDEBAR') return 'TOPBAR';
  if (upper === 'HOMEPAGE') return 'HOME_SECTION';
  if ((ADVERTISEMENT_PLACEMENTS as readonly string[]).includes(upper)) {
    return upper as AdvertisementPlacement;
  }
  return null;
}

/** Map MIME / format to supported media type. Returns null if unsupported. */
export function resolveAdvertisementMediaType(input: {
  mimeType?: string;
  format?: string;
  url?: string;
}): AdvertisementMediaType | null {
  // rod-fileupload stores Cloudinary resource_type as `type` ("image"|"video"|"raw"),
  // so prefer real MIME / format / URL extension over that short value.
  const rawType = (input.mimeType || '').toLowerCase();
  const format = (input.format || '').toLowerCase();
  const url = (input.url || '').toLowerCase();
  const mime =
    rawType.includes('/') || rawType.includes('gif') || rawType.includes('jpeg')
      ? rawType
      : format || rawType;

  if (mime.includes('gif') || format === 'gif' || url.endsWith('.gif')) return 'GIF';
  if (
    mime.startsWith('video/') ||
    mime === 'video' ||
    mime.includes('mp4') ||
    mime.includes('webm') ||
    mime.includes('quicktime') ||
    format.match(/^(mp4|webm|mov|m4v)$/) ||
    url.match(/\.(mp4|webm|mov|m4v)(\?|$)/)
  ) {
    return 'VIDEO';
  }
  if (
    mime.startsWith('image/') ||
    mime === 'image' ||
    mime.includes('jpeg') ||
    mime.includes('jpg') ||
    mime.includes('png') ||
    mime.includes('webp') ||
    format.match(/^(jpe?g|png|webp|bmp)$/) ||
    url.match(/\.(jpe?g|png|webp|bmp)(\?|$)/)
  ) {
    return 'IMAGE';
  }
  return null;
}

/**
 * Auto-derive status from schedule.
 * DRAFT stored in DB stays draft until admin republishes (handled in service).
 */
export function computeAdvertisementStatus(
  startDate: Date,
  endDate: Date,
  now: Date = new Date()
): AdvertisementStatus {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const current = now.getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return 'DRAFT';
  if (current < start) return 'SCHEDULED';
  if (current > end) return 'EXPIRED';
  return 'PUBLISHED';
}
