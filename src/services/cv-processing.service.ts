import CvDocument from '../models/CvDocument';
import { normalizeParseStatus } from '../config/cv.config';
import {
  getCvExtractionSummary,
  runFullExtraction,
} from './cv-extraction.service';
import { syncProfileReviewFromCv } from './cv-profile-review.service';
import { ICvExtractionResult } from '../types/cv.types';

const logProcessing = (
  cvId: string,
  event: 'started' | 'completed' | 'failed',
  details: {
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    error?: string;
    extractionMethod?: string;
  }
) => {
  const base = `[CV Processing] cvId=${cvId} event=${event} startedAt=${details.startedAt.toISOString()}`;
  if (event === 'started') {
    console.log(base);
    return;
  }

  const completedAt = details.completedAt?.toISOString() || 'n/a';
  const durationMs = details.durationMs ?? 'n/a';
  const method = details.extractionMethod
    ? ` method=${details.extractionMethod}`
    : '';
  const error = details.error ? ` error="${details.error}"` : '';

  if (event === 'completed') {
    console.log(
      `${base} completedAt=${completedAt} durationMs=${durationMs}${method}`
    );
    return;
  }

  console.error(
    `${base} completedAt=${completedAt} durationMs=${durationMs}${error}`
  );
};

export const startProcessing = async (cvId: string) => {
  const cv = await CvDocument.findById(cvId);
  if (!cv) {
    throw Object.assign(new Error('CV not found'), { statusCode: 404 });
  }

  cv.parseStatus = 'PROCESSING';
  cv.parseError = undefined;
  await cv.save();
  return cv;
};

export const processCv = async (
  cvId: string
): Promise<ICvExtractionResult> => {
  const cv = await CvDocument.findById(cvId);
  if (!cv) {
    throw Object.assign(new Error('CV not found'), { statusCode: 404 });
  }

  return runFullExtraction(cv);
};

export const markCompleted = async (
  cvId: string,
  extraction: ICvExtractionResult
) => {
  const cv = await CvDocument.findByIdAndUpdate(
    cvId,
    {
      $set: {
        parseStatus: 'COMPLETED',
        rawText: extraction.rawText,
        extractedData: extraction.extractedData,
        confidenceScores: extraction.confidenceScores,
        aiProvider: extraction.aiProvider,
        extractionMethod: extraction.extractionMethod,
        textExtractionDurationMs: extraction.textExtractionDurationMs,
        structuredExtractionDurationMs:
          extraction.structuredExtractionDurationMs,
        processedAt: new Date(),
        parseError: undefined,
      },
    },
    { new: true }
  );

  if (!cv) {
    throw Object.assign(new Error('CV not found'), { statusCode: 404 });
  }

  await syncProfileReviewFromCv(
    String(cv.employeeId),
    String(cv._id),
    extraction.extractedData,
    extraction.confidenceScores
  );

  return cv;
};

export const markFailed = async (cvId: string, error: string) => {
  const cv = await CvDocument.findByIdAndUpdate(
    cvId,
    {
      $set: {
        parseStatus: 'FAILED',
        parseError: error,
        processedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!cv) {
    throw Object.assign(new Error('CV not found'), { statusCode: 404 });
  }

  return cv;
};

export const runCvProcessing = async (cvId: string) => {
  const startedAt = new Date();
  logProcessing(cvId, 'started', { startedAt });

  try {
    await startProcessing(cvId);
    const extraction = await processCv(cvId);
    const cv = await markCompleted(cvId, extraction);
    const completedAt = new Date();
    logProcessing(cvId, 'completed', {
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      extractionMethod: extraction.extractionMethod,
    });
    return cv;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'CV processing failed';
    await markFailed(cvId, message);
    const completedAt = new Date();
    logProcessing(cvId, 'failed', {
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      error: message,
    });
    throw error;
  }
};

export const getCvProcessingSummary = (
  cv: InstanceType<typeof CvDocument>
) => ({
  parseStatus: normalizeParseStatus(cv.parseStatus),
  processedAt: cv.processedAt,
  parseError: cv.parseError,
  hasRawText: Boolean(cv.rawText?.trim()),
  extractionMethod: cv.extractionMethod,
  aiProvider: cv.aiProvider,
  textExtractionDurationMs: cv.textExtractionDurationMs,
  structuredExtractionDurationMs: cv.structuredExtractionDurationMs,
  extractionSummary: getCvExtractionSummary(cv.extractedData),
});

/**
 * Run CV processing in the background without blocking the caller.
 * Reuses runCvProcessing — no duplicate pipeline logic.
 */
export const scheduleCvProcessing = (cvId: string): void => {
  const id = String(cvId);
  void runCvProcessing(id).catch((error) => {
    console.error(
      `[CV Processing] Scheduled run failed cvId=${id}`,
      error
    );
  });
};
