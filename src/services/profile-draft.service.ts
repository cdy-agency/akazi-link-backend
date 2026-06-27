import { Types } from 'mongoose';
import CandidateProfileDraft from '../models/CandidateProfileDraft';
import Employee from '../models/Employee';
import {
  DEFAULT_PROFILE_REVIEW_STATUS,
  ProfileDraftReviewStatus,
} from '../config/cv-profile-review.config';
import {
  DEFAULT_PROFILE_STATUS,
  ProfileStatus,
} from '../config/profile-status.config';
import {
  ICvAiExtractedData,
  ICvConfidenceScores,
} from '../types/cv.types';
import { IApplicationProfileSnapshot } from '../types/profile-draft.types';

const joinLines = (items?: string[]): string =>
  (items || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n');

export const sanitizeAiExtractedData = (
  input?: Partial<ICvAiExtractedData> | null
): ICvAiExtractedData => {
  const certs = (input?.certifications || input?.certificates || [])
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    fullName: input?.fullName?.trim() || undefined,
    email: input?.email?.trim() || undefined,
    phone: input?.phone?.trim() || undefined,
    location: input?.location?.trim() || undefined,
    professionalSummary: input?.professionalSummary?.trim() || undefined,
    skills: (input?.skills || []).map((s) => s.trim()).filter(Boolean),
    interviewSkills: (input?.interviewSkills || [])
      .map((s) => s.trim())
      .filter(Boolean),
    education: (input?.education || []).map((s) => s.trim()).filter(Boolean),
    experience: (input?.experience || []).map((s) => s.trim()).filter(Boolean),
    languages: (input?.languages || []).map((s) => s.trim()).filter(Boolean),
    certifications: certs,
    certificates: certs,
    linkedInUrl: input?.linkedInUrl?.trim() || undefined,
    githubUrl: input?.githubUrl?.trim() || undefined,
    portfolioUrl: input?.portfolioUrl?.trim() || undefined,
    yearsOfExperience:
      typeof input?.yearsOfExperience === 'number'
        ? input.yearsOfExperience
        : undefined,
  };
};

export const upsertProfileDraftFromExtraction = async (params: {
  employeeId: string;
  cvId: string;
  extractedData: ICvAiExtractedData;
  confidenceScores?: ICvConfidenceScores;
}) => {
  const sanitized = sanitizeAiExtractedData(params.extractedData);
  const extractedAt = new Date();

  const draft = await CandidateProfileDraft.findOneAndUpdate(
    { employeeId: params.employeeId },
    {
      $set: {
        cvId: new Types.ObjectId(params.cvId),
        extractedData: sanitized,
        confidenceScores: params.confidenceScores || {},
        reviewStatus: 'REVIEW_REQUIRED' satisfies ProfileDraftReviewStatus,
        profileStatus: 'REVIEW_REQUIRED' satisfies ProfileStatus,
        extractedAt,
        approvedAt: undefined,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Employee.findByIdAndUpdate(params.employeeId, {
    $set: {
      profileStatus: 'REVIEW_REQUIRED' satisfies ProfileStatus,
      profileReviewStatus: DEFAULT_PROFILE_REVIEW_STATUS,
      profileReviewData: sanitized,
      profileReviewCvId: new Types.ObjectId(params.cvId),
      profileApprovedAt: undefined,
    },
  });

  return draft;
};

export const getProfileDraftByEmployeeId = async (employeeId: string) =>
  CandidateProfileDraft.findOne({ employeeId });

export const updateProfileDraftData = async (
  employeeId: string,
  extractedData: Partial<ICvAiExtractedData>
) => {
  const sanitized = sanitizeAiExtractedData(extractedData);
  const draft = await CandidateProfileDraft.findOneAndUpdate(
    { employeeId },
    { $set: { extractedData: sanitized } },
    { new: true }
  );

  if (draft) {
    await Employee.findByIdAndUpdate(employeeId, {
      $set: { profileReviewData: sanitized },
    });
  }

  return draft;
};

export const markProfileDraftApproved = async (
  employeeId: string,
  extractedData: ICvAiExtractedData
) => {
  const approvedAt = new Date();
  const sanitized = sanitizeAiExtractedData(extractedData);

  await CandidateProfileDraft.findOneAndUpdate(
    { employeeId },
    {
      $set: {
        extractedData: sanitized,
        reviewStatus: 'APPROVED',
        profileStatus: 'APPROVED' satisfies ProfileStatus,
        approvedAt,
      },
    },
    { upsert: true, new: true }
  );

  return approvedAt;
};

export const markProfileDraftRejected = async (employeeId: string) => {
  await CandidateProfileDraft.findOneAndUpdate(
    { employeeId },
    { $set: { reviewStatus: 'REJECTED', profileStatus: 'REVIEW_REQUIRED', approvedAt: undefined } }
  );
};

export const buildApplicationProfileSnapshot = async (
  employeeId: string
): Promise<IApplicationProfileSnapshot> => {
  const [employee, draft] = await Promise.all([
    Employee.findById(employeeId).select(
      'name email phoneNumber location about skills education experience languages certificates'
    ),
    getProfileDraftByEmployeeId(employeeId),
  ]);

  const draftData = draft?.extractedData;
  const educationFromEmployee =
    employee?.education?.trim()
      ? employee.education.split('\n').filter(Boolean)
      : [];
  const experienceFromEmployee =
    employee?.experience?.trim()
      ? employee.experience.split('\n').filter(Boolean)
      : [];

  return {
    fullName: employee?.name || draftData?.fullName,
    email: employee?.email || draftData?.email,
    phone: employee?.phoneNumber || draftData?.phone,
    location: employee?.location || draftData?.location,
    professionalSummary:
      draftData?.professionalSummary || employee?.about || undefined,
    skills: employee?.skills?.length
      ? employee.skills
      : draftData?.skills || [],
    interviewSkills: draftData?.interviewSkills || [],
    education: educationFromEmployee.length
      ? educationFromEmployee
      : draftData?.education || [],
    experience: experienceFromEmployee.length
      ? experienceFromEmployee
      : draftData?.experience || [],
    languages: employee?.languages?.length
      ? employee.languages
      : draftData?.languages || [],
    certifications:
      employee?.certificates?.length
        ? employee.certificates
        : draftData?.certifications || [],
    linkedInUrl: draftData?.linkedInUrl,
    githubUrl: draftData?.githubUrl,
    portfolioUrl: draftData?.portfolioUrl,
    yearsOfExperience: draftData?.yearsOfExperience,
    capturedAt: new Date(),
  };
};

export const aiDataToEmployeeUpdate = (data: ICvAiExtractedData) => ({
  name: data.fullName,
  phoneNumber: data.phone,
  location: data.location,
  about: data.professionalSummary,
  skills: data.skills,
  education: joinLines(data.education),
  experience: joinLines(data.experience),
  languages: data.languages,
  certificates: data.certifications,
});

export const getDraftReviewFields = (
  draft: { reviewStatus?: string; approvedAt?: Date } | null | undefined
) => ({
  profileReviewStatus: draft?.reviewStatus || DEFAULT_PROFILE_REVIEW_STATUS,
  profileApprovedAt: draft?.approvedAt,
});
