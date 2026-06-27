import { Types } from 'mongoose';
import Employee from '../models/Employee';
import CvDocument from '../models/CvDocument';
import CandidateProfileDraft from '../models/CandidateProfileDraft';
import {
  DEFAULT_PROFILE_REVIEW_STATUS,
  ProfileReviewStatus,
  normalizeProfileReviewStatus,
} from '../config/cv-profile-review.config';
import {
  normalizeProfileStatus,
  ProfileStatus,
} from '../config/profile-status.config';
import { ICvAiExtractedData, ICvConfidenceScores } from '../types/cv.types';
import { normalizeExtractedData } from './cv-extraction.service';
import { normalizeParseStatus } from '../config/cv.config';
import {
  aiDataToEmployeeUpdate,
  markProfileDraftApproved,
  markProfileDraftRejected,
  sanitizeAiExtractedData,
  updateProfileDraftData,
  upsertProfileDraftFromExtraction,
} from './profile-draft.service';

export const syncProfileReviewFromCv = async (
  employeeId: string,
  cvId: string,
  extractedData?: ICvAiExtractedData | null,
  confidenceScores?: ICvConfidenceScores
) => {
  await upsertProfileDraftFromExtraction({
    employeeId,
    cvId,
    extractedData: normalizeExtractedData(extractedData),
    confidenceScores,
  });
};

export const loadProfileReviewContext = async (employeeId: string) => {
  const [employee, draft] = await Promise.all([
    Employee.findById(employeeId).select(
      'email name profileStatus profileReviewStatus profileApprovedAt profileReviewData profileReviewCvId primaryCvId'
    ),
    CandidateProfileDraft.findOne({ employeeId }),
  ]);

  if (!employee) {
    throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  }

  const cvId =
    draft?.cvId || employee.profileReviewCvId || employee.primaryCvId;
  const cv = cvId ? await CvDocument.findById(cvId) : null;

  let reviewData = sanitizeAiExtractedData(
    (draft?.extractedData ||
      employee.profileReviewData ||
      cv?.extractedData) as ICvAiExtractedData | undefined
  );

  if (!reviewData.email && employee.email) {
    reviewData = { ...reviewData, email: employee.email };
  }

  return {
    employee,
    draft,
    cv,
    reviewData,
    confidenceScores: draft?.confidenceScores || cv?.confidenceScores || {},
  };
};

export const saveProfileReviewDraft = async (
  employeeId: string,
  reviewData: Partial<ICvAiExtractedData>
) => {
  const draft = await updateProfileDraftData(employeeId, reviewData);
  if (!draft) {
    throw Object.assign(new Error('Profile draft not found'), { statusCode: 404 });
  }
  return draft;
};

const validateForApproval = (
  reviewData: ICvAiExtractedData,
  cvParseStatus?: string
) => {
  const normalizedCvStatus = normalizeParseStatus(cvParseStatus);

  if (normalizedCvStatus !== 'COMPLETED') {
    throw Object.assign(
      new Error('CV processing must be completed before approving profile'),
      { statusCode: 400 }
    );
  }

  if (!reviewData.fullName?.trim()) {
    throw Object.assign(new Error('Full name is required to approve profile'), {
      statusCode: 400,
    });
  }
};

export const approveProfileReview = async (
  employeeId: string,
  reviewData: Partial<ICvAiExtractedData>,
  cvParseStatus?: string
) => {
  const sanitized = sanitizeAiExtractedData(reviewData);
  validateForApproval(sanitized, cvParseStatus);

  const approvedAt = await markProfileDraftApproved(employeeId, sanitized);

  const employee = await Employee.findByIdAndUpdate(
    employeeId,
    {
      $set: {
        ...aiDataToEmployeeUpdate(sanitized),
        profileReviewData: sanitized,
        profileReviewStatus: 'APPROVED' satisfies ProfileReviewStatus,
        profileStatus: 'APPROVED' satisfies ProfileStatus,
        profileApprovedAt: approvedAt,
      },
    },
    { new: true, runValidators: true }
  ).select(
    'email name phoneNumber location about skills education experience languages certificates profileReviewStatus profileApprovedAt profileReviewData profileReviewCvId primaryCvId'
  );

  if (!employee) {
    throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  }

  return { employee, approvedAt };
};

export const rejectProfileReview = async (employeeId: string) => {
  await markProfileDraftRejected(employeeId);

  const employee = await Employee.findByIdAndUpdate(
    employeeId,
    {
      $set: {
        profileReviewStatus: 'REJECTED' satisfies ProfileReviewStatus,
        profileStatus: 'REVIEW_REQUIRED' satisfies ProfileStatus,
        profileApprovedAt: undefined,
      },
    },
    { new: true }
  ).select(
    'email profileReviewStatus profileApprovedAt profileReviewData profileReviewCvId primaryCvId'
  );

  if (!employee) {
    throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  }

  return employee;
};

export const formatProfileReviewResponse = (
  employee: {
    email?: string;
    profileReviewStatus?: string;
    profileStatus?: string;
    profileApprovedAt?: Date;
    profileReviewCvId?: Types.ObjectId | null;
    primaryCvId?: Types.ObjectId | null;
  },
  reviewData: ICvAiExtractedData,
  cv: InstanceType<typeof CvDocument> | null,
  confidenceScores?: ICvConfidenceScores
) => ({
  reviewStatus: normalizeProfileReviewStatus(employee.profileReviewStatus),
  profileStatus: normalizeProfileStatus(
    employee.profileStatus || employee.profileReviewStatus
  ),
  approvedAt: employee.profileApprovedAt,
  reviewData,
  confidenceScores: confidenceScores || {},
  cv: cv
    ? {
        id: cv._id,
        fileName: cv.fileName,
        parseStatus: normalizeParseStatus(cv.parseStatus),
        processedAt: cv.processedAt,
        version: cv.version,
        aiProvider: cv.aiProvider,
      }
    : null,
  email: employee.email,
});

export const getEmployeeReviewFields = (
  employee:
    | {
        profileReviewStatus?: string;
        profileApprovedAt?: Date;
      }
    | null
    | undefined
) => ({
  profileReviewStatus: normalizeProfileReviewStatus(
    employee?.profileReviewStatus
  ),
  profileApprovedAt: employee?.profileApprovedAt,
});
