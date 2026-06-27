export const APPLICATION_STATUSES = [
  'APPLIED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'SELECTED',
  'OFFER_SENT',
  'HIRED',
  'REJECTED',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const INTERVIEW_TYPES = ['ONLINE', 'PHYSICAL', 'PHONE'] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_STATUSES = [
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_RECOMMENDATIONS = [
  'STRONG_HIRE',
  'HIRE',
  'MAYBE',
  'REJECT',
] as const;
export type InterviewRecommendation =
  (typeof INTERVIEW_RECOMMENDATIONS)[number];

export const OFFER_STATUSES = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const AUDIT_ACTIONS = {
  STATUS_CHANGE: 'STATUS_CHANGE',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEW_UPDATED: 'INTERVIEW_UPDATED',
  INTERVIEW_COMPLETED: 'INTERVIEW_COMPLETED',
  INTERVIEW_CANCELLED: 'INTERVIEW_CANCELLED',
  OFFER_CREATED: 'OFFER_CREATED',
  OFFER_SENT: 'OFFER_SENT',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_DECLINED: 'OFFER_DECLINED',
  CANDIDATE_HIRED: 'CANDIDATE_HIRED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
