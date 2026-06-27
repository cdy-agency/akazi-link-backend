import {
  APPLICATION_STATUSES,
  ApplicationStatus,
} from './pipeline.config';

const LEGACY_STATUS_MAP: Record<string, ApplicationStatus> = {
  pending: 'APPLIED',
  applied: 'APPLIED',
  reviewed: 'UNDER_REVIEW',
  interview: 'UNDER_REVIEW',
  under_review: 'UNDER_REVIEW',
  shortlisted: 'SHORTLISTED',
  interview_scheduled: 'INTERVIEW_SCHEDULED',
  interview_completed: 'INTERVIEW_COMPLETED',
  selected: 'SELECTED',
  offer_sent: 'OFFER_SENT',
  rejected: 'REJECTED',
  hired: 'HIRED',
  PENDING: 'APPLIED',
  REVIEWED: 'UNDER_REVIEW',
};

export { APPLICATION_STATUSES, ApplicationStatus };

export const normalizeApplicationStatus = (
  status: string | undefined | null
): ApplicationStatus => {
  if (!status) return 'APPLIED';
  const upper = status.toUpperCase();
  if (APPLICATION_STATUSES.includes(upper as ApplicationStatus)) {
    return upper as ApplicationStatus;
  }
  return LEGACY_STATUS_MAP[status] || LEGACY_STATUS_MAP[status.toLowerCase()] || 'APPLIED';
};

export const isApplicationStatus = (
  value: unknown
): value is ApplicationStatus =>
  typeof value === 'string' &&
  APPLICATION_STATUSES.includes(
    normalizeApplicationStatus(value) as ApplicationStatus
  );

export const statusFilterValues = (status: ApplicationStatus): string[] => {
  const values = new Set<string>([status, status.toLowerCase()]);

  const legacyAliases: Partial<Record<ApplicationStatus, string[]>> = {
    APPLIED: ['PENDING', 'pending', 'applied'],
    UNDER_REVIEW: ['REVIEWED', 'reviewed', 'interview', 'under_review'],
    SHORTLISTED: ['shortlisted'],
    REJECTED: ['rejected'],
    HIRED: ['hired'],
  };

  (legacyAliases[status] || []).forEach((alias) => values.add(alias));
  return Array.from(values);
};

export const displayApplicationStatus = (status: string): string => {
  const normalized = normalizeApplicationStatus(status);
  return normalized
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};
