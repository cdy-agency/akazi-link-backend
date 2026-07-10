export const PROVIDER_TYPES = ['COMPANY', 'INDIVIDUAL'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const PROVIDER_STATUSES = [
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export const SERVICE_REQUEST_STATUSES = [
  'NEW',
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const PREFERRED_CONTACT_METHODS = ['PHONE', 'WHATSAPP', 'EMAIL'] as const;
export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];

export const PROVIDER_SORT_OPTIONS = ['newest', 'alphabetical', 'rating', 'closest'] as const;
export type ProviderSortOption = (typeof PROVIDER_SORT_OPTIONS)[number];

export const AVAILABILITY_STATUSES = ['AVAILABLE', 'BUSY', 'UNAVAILABLE'] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const PRICING_MODELS = ['NEGOTIABLE', 'HOURLY', 'DAILY', 'FIXED'] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const MARKETPLACE_LIMITS = {
  minReviewRating: 1,
  maxReviewRating: 5,
} as const;

export const PUBLIC_PROVIDER_STATUSES: ProviderStatus[] = ['APPROVED'];
