/**
 * Shared upload size caps for API validation.
 * Mirror of job-platform/lib/upload-limits.ts (keep values aligned).
 */

export const UPLOAD_LIMITS = {
  logo: 4 * 1024 * 1024,
  image: 10 * 1024 * 1024,
  document: 6 * 1024 * 1024,
  cv: 10 * 1024 * 1024,
  adMedia: 25 * 1024 * 1024,
  video: 50 * 1024 * 1024,
} as const;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export function oversizedUploadMessage(
  size: number,
  maxBytes: number,
  label = 'File'
) {
  return `${label} is too large (${formatFileSize(size)}). Please upload a file under ${formatFileSize(maxBytes)}.`;
}

/** Throws 400 when file size exceeds maxBytes. */
export function assertUploadedFileSize(
  file: { size?: number; bytes?: number; name?: string } | null | undefined,
  maxBytes: number,
  label = 'File'
) {
  if (!file) return;
  const size =
    typeof file.size === 'number' && file.size > 0
      ? file.size
      : typeof file.bytes === 'number'
        ? file.bytes
        : 0;
  if (!size || size <= maxBytes) return;
  throw Object.assign(new Error(oversizedUploadMessage(size, maxBytes, label)), {
    statusCode: 400,
  });
}

export function assertUploadedFilesSize(
  files: Array<{ size?: number; bytes?: number; name?: string }> | null | undefined,
  maxBytes: number,
  label = 'File'
) {
  if (!files?.length) return;
  for (const file of files) {
    assertUploadedFileSize(file, maxBytes, file.name || label);
  }
}

/** Map assertUploadedFileSize errors to HTTP 400 responses. */
export function respondUploadError(
  res: { status: (code: number) => { json: (body: unknown) => unknown } },
  error: unknown,
  fallbackMessage: string
) {
  const err = error as { statusCode?: number; message?: string } | null;
  if (err?.statusCode === 400 && err.message) {
    return res.status(400).json({ message: err.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}
