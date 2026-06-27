export const JOB_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'CLOSED',
  'ARCHIVED',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const isJobStatus = (value: unknown): value is JobStatus =>
  typeof value === 'string' && JOB_STATUSES.includes(value as JobStatus);

export const syncJobActiveFlag = (status: JobStatus): boolean =>
  status === 'PUBLISHED';
