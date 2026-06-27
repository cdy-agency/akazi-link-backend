export const CV_MAX_BYTES = 10 * 1024 * 1024;

export const CV_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const CV_ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

export const CV_ALLOWED_FORMATS = new Set(['pdf', 'doc', 'docx']);

export const CV_FORMAT_TO_EXTENSION: Record<string, string> = {
  pdf: '.pdf',
  doc: '.doc',
  docx: '.docx',
};

export const CV_EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const getExtension = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  if (dot === -1) return '';
  return fileName.slice(dot).toLowerCase();
};

export const resolveCvExtension = (file: {
  name?: string;
  url?: string;
  format?: string;
}): string | null => {
  const fromName = getExtension(file.name || '');
  if (CV_ALLOWED_EXTENSIONS.has(fromName)) {
    return fromName;
  }

  const fromUrl = getExtension((file.url || '').split('?')[0]);
  if (CV_ALLOWED_EXTENSIONS.has(fromUrl)) {
    return fromUrl;
  }

  const format = file.format?.toLowerCase();
  if (format) {
    if (CV_FORMAT_TO_EXTENSION[format]) {
      return CV_FORMAT_TO_EXTENSION[format];
    }
    const fromFormat = `.${format}`;
    if (CV_ALLOWED_EXTENSIONS.has(fromFormat)) {
      return fromFormat;
    }
  }

  return null;
};

export const resolveCvMimeType = (
  extension: string,
  fallback?: string
): string => {
  return CV_EXTENSION_TO_MIME[extension] || fallback || 'application/octet-stream';
};

export const CV_PARSE_STATUSES = [
  'not_started',
  'pending',
  'completed',
  'failed',
  'NOT_STARTED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
] as const;

export type CvParseStatus = (typeof CV_PARSE_STATUSES)[number];

export const CV_PARSE_STATUS_VALUES = [
  'NOT_STARTED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
] as const;

export type CvParseStatusNormalized =
  (typeof CV_PARSE_STATUS_VALUES)[number];

const LEGACY_PARSE_STATUS_MAP: Record<string, CvParseStatusNormalized> = {
  not_started: 'NOT_STARTED',
  pending: 'PROCESSING',
  completed: 'COMPLETED',
  failed: 'FAILED',
};

export const normalizeParseStatus = (
  status: string | undefined | null
): CvParseStatusNormalized => {
  if (!status) return 'NOT_STARTED';
  const upper = status.toUpperCase();
  if (CV_PARSE_STATUS_VALUES.includes(upper as CvParseStatusNormalized)) {
    return upper as CvParseStatusNormalized;
  }
  return LEGACY_PARSE_STATUS_MAP[status.toLowerCase()] || 'NOT_STARTED';
};

export const isProcessableParseStatus = (
  status: string | undefined | null
): boolean => {
  const normalized = normalizeParseStatus(status);
  return normalized === 'NOT_STARTED' || normalized === 'FAILED';
};

export const isRetryableParseStatus = (
  status: string | undefined | null
): boolean => normalizeParseStatus(status) === 'FAILED';

export const isProcessingParseStatus = (
  status: string | undefined | null
): boolean => normalizeParseStatus(status) === 'PROCESSING';
