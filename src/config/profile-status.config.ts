export const PROFILE_STATUSES = [
  'DRAFT',
  'REVIEW_REQUIRED',
  'APPROVED',
] as const;

export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

export const DEFAULT_PROFILE_STATUS: ProfileStatus = 'DRAFT';

export const SEARCHABLE_PROFILE_STATUS: ProfileStatus = 'APPROVED';

export const EXPERIENCE_RANGE_FILTERS = [
  '0-1',
  '1-3',
  '3-5',
  '5+',
] as const;

export type ExperienceRangeFilter = (typeof EXPERIENCE_RANGE_FILTERS)[number];

export const normalizeProfileStatus = (
  status: string | undefined | null
): ProfileStatus => {
  if (!status) return DEFAULT_PROFILE_STATUS;
  const upper = status.toUpperCase();
  if (upper === 'PENDING_REVIEW' || upper === 'REJECTED') {
    return 'REVIEW_REQUIRED';
  }
  if (PROFILE_STATUSES.includes(upper as ProfileStatus)) {
    return upper as ProfileStatus;
  }
  if (upper === 'REVIEW_REQUIRED') return 'REVIEW_REQUIRED';
  return DEFAULT_PROFILE_STATUS;
};

export const isSearchableProfileStatus = (
  status: string | undefined | null
): boolean => normalizeProfileStatus(status) === SEARCHABLE_PROFILE_STATUS;

export const resolveExperienceRange = (
  range: ExperienceRangeFilter
): { min?: number; max?: number } => {
  switch (range) {
    case '0-1':
      return { min: 0, max: 1 };
    case '1-3':
      return { min: 1, max: 3 };
    case '3-5':
      return { min: 3, max: 5 };
    case '5+':
      return { min: 5 };
    default:
      return {};
  }
};

export const isValidExperienceRange = (
  value: string
): value is ExperienceRangeFilter =>
  EXPERIENCE_RANGE_FILTERS.includes(value as ExperienceRangeFilter);
