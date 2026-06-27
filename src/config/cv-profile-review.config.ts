export const PROFILE_REVIEW_STATUSES = [
  'REVIEW_REQUIRED',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;

export type ProfileReviewStatus = (typeof PROFILE_REVIEW_STATUSES)[number];

export const PROFILE_DRAFT_REVIEW_STATUSES = [
  'REVIEW_REQUIRED',
  'APPROVED',
  'REJECTED',
] as const;

export type ProfileDraftReviewStatus =
  (typeof PROFILE_DRAFT_REVIEW_STATUSES)[number];

export const DEFAULT_PROFILE_REVIEW_STATUS: ProfileReviewStatus =
  'REVIEW_REQUIRED';

export const PROFILE_REVIEW_ACTIONS = ['save', 'approve', 'reject'] as const;

export type ProfileReviewAction = (typeof PROFILE_REVIEW_ACTIONS)[number];

export const normalizeProfileReviewStatus = (
  status: string | undefined | null
): ProfileReviewStatus => {
  if (!status) return DEFAULT_PROFILE_REVIEW_STATUS;
  const upper = status.toUpperCase();
  if (upper === 'PENDING_REVIEW') return 'REVIEW_REQUIRED';
  if (PROFILE_REVIEW_STATUSES.includes(upper as ProfileReviewStatus)) {
    return upper as ProfileReviewStatus;
  }
  return DEFAULT_PROFILE_REVIEW_STATUS;
};

export const isValidProfileReviewAction = (
  action: string
): action is ProfileReviewAction =>
  PROFILE_REVIEW_ACTIONS.includes(action as ProfileReviewAction);
