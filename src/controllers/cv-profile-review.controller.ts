/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import {
  isValidProfileReviewAction,
  ProfileReviewAction,
} from '../config/cv-profile-review.config';
import {
  approveProfileReview,
  formatProfileReviewResponse,
  loadProfileReviewContext,
  rejectProfileReview,
  saveProfileReviewDraft,
} from '../services/cv-profile-review.service';
import { ICvAiExtractedData } from '../types/cv.types';

const handleError = (res: Response, error: unknown) => {
  const statusCode = (error as { statusCode?: number })?.statusCode;
  const message = error instanceof Error ? error.message : 'Server error';

  if (statusCode) {
    return res.status(statusCode).json({ message });
  }

  console.error('Profile review error:', error);
  return res.status(500).json({ message: 'Server error' });
};

const parseReviewData = (body: unknown): Partial<ICvAiExtractedData> | undefined => {
  if (!body || typeof body !== 'object') return undefined;
  const data = (body as { reviewData?: unknown }).reviewData;
  if (!data || typeof data !== 'object') return undefined;
  return data as Partial<ICvAiExtractedData>;
};

export const getProfileReview = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const { employee, cv, reviewData, confidenceScores } =
      await loadProfileReviewContext(employeeId);

    res.status(200).json({
      message: 'Profile review retrieved successfully',
      profileReview: formatProfileReviewResponse(
        employee,
        reviewData,
        cv,
        confidenceScores
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const patchProfileReview = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Employee ID not found in token' });
    }

    const action = (req.body as { action?: string }).action;
    if (!action || !isValidProfileReviewAction(action)) {
      return res.status(400).json({
        message: 'action must be one of: save, approve, reject',
      });
    }

    const reviewData = parseReviewData(req.body);
    const context = await loadProfileReviewContext(employeeId);
    const mergedReviewData = {
      ...context.reviewData,
      ...(reviewData || {}),
    };

    let approvedAt: Date | undefined;

    if (action === 'save') {
      await saveProfileReviewDraft(employeeId, mergedReviewData);
    } else if (action === 'approve') {
      const result = await approveProfileReview(
        employeeId,
        mergedReviewData,
        context.cv?.parseStatus
      );
      approvedAt = result.approvedAt;
    } else if (action === 'reject') {
      await rejectProfileReview(employeeId);
    }

    const refreshed = await loadProfileReviewContext(employeeId);

    const messageByAction: Record<ProfileReviewAction, string> = {
      save: 'Profile review saved successfully',
      approve: 'Profile approved and updated successfully',
      reject: 'Extracted profile data rejected',
    };

    res.status(200).json({
      message: messageByAction[action],
      profileReview: formatProfileReviewResponse(
        refreshed.employee,
        refreshed.reviewData,
        refreshed.cv,
        refreshed.confidenceScores
      ),
      approvedAt,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
