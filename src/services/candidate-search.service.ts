import { Types, PipelineStage } from 'mongoose';
import Employee from '../models/Employee';
import CandidateProfileDraft from '../models/CandidateProfileDraft';
import Application from '../models/Application';
import CvDocument from '../models/CvDocument';
import {
  ExperienceRangeFilter,
  isSearchableProfileStatus,
  isValidExperienceRange,
  normalizeProfileStatus,
  resolveExperienceRange,
  SEARCHABLE_PROFILE_STATUS,
} from '../config/profile-status.config';
import { normalizeApplicationStatus } from '../config/application.config';
import { sanitizeAiExtractedData } from './profile-draft.service';

export interface CandidateSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  skill?: string;
  interviewSkill?: string;
  language?: string;
  certification?: string;
  education?: string;
  experience?: string;
  location?: string;
  yearsExperience?: ExperienceRangeFilter;
  profileStatus?: string;
  applicationStatus?: string;
  searchableOnly?: boolean;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRegex = (value?: string) => {
  if (!value?.trim()) return null;
  return new RegExp(escapeRegex(value.trim()), 'i');
};

const buildCandidateMatch = (params: CandidateSearchParams) => {
  const and: Record<string, unknown>[] = [];

  const statusFilter = params.searchableOnly !== false
    ? params.profileStatus
      ? normalizeProfileStatus(params.profileStatus)
      : SEARCHABLE_PROFILE_STATUS
    : params.profileStatus
      ? normalizeProfileStatus(params.profileStatus)
      : undefined;

  if (statusFilter) {
    and.push({
      $or: [
        { profileStatus: statusFilter },
        { profileReviewStatus: statusFilter },
        { 'draft.profileStatus': statusFilter },
        { 'draft.reviewStatus': statusFilter },
      ],
    });
  }

  const qRegex = buildRegex(params.q);
  if (qRegex) {
    and.push({
      $or: [
        { name: qRegex },
        { email: qRegex },
        { 'draft.extractedData.fullName': qRegex },
      ],
    });
  }

  const skillRegex = buildRegex(params.skill);
  if (skillRegex) {
    and.push({
      $or: [
        { skills: skillRegex },
        { 'draft.extractedData.skills': skillRegex },
      ],
    });
  }

  const interviewSkillRegex = buildRegex(params.interviewSkill);
  if (interviewSkillRegex) {
    and.push({ 'draft.extractedData.interviewSkills': interviewSkillRegex });
  }

  const languageRegex = buildRegex(params.language);
  if (languageRegex) {
    and.push({
      $or: [
        { languages: languageRegex },
        { 'draft.extractedData.languages': languageRegex },
      ],
    });
  }

  const certificationRegex = buildRegex(params.certification);
  if (certificationRegex) {
    and.push({
      $or: [
        { certificates: certificationRegex },
        { 'draft.extractedData.certifications': certificationRegex },
      ],
    });
  }

  const educationRegex = buildRegex(params.education);
  if (educationRegex) {
    and.push({
      $or: [
        { education: educationRegex },
        { 'draft.extractedData.education': educationRegex },
      ],
    });
  }

  const experienceRegex = buildRegex(params.experience);
  if (experienceRegex) {
    and.push({
      $or: [
        { experience: experienceRegex },
        { 'draft.extractedData.experience': experienceRegex },
      ],
    });
  }

  const locationRegex = buildRegex(params.location);
  if (locationRegex) {
    and.push({
      $or: [
        { location: locationRegex },
        { 'draft.extractedData.location': locationRegex },
      ],
    });
  }

  if (params.yearsExperience && isValidExperienceRange(params.yearsExperience)) {
    const { min, max } = resolveExperienceRange(params.yearsExperience);
    const yearsFilter: Record<string, number> = {};
    if (min != null) yearsFilter.$gte = min;
    if (max != null) yearsFilter.$lte = max;
    and.push({ 'draft.extractedData.yearsOfExperience': yearsFilter });
  }

  if (params.applicationStatus?.trim()) {
    const normalized = normalizeApplicationStatus(params.applicationStatus);
    and.push({ latestApplicationStatus: normalized });
  }

  return and.length ? { $and: and } : {};
};

const basePipeline: PipelineStage[] = [
  { $match: { role: 'employee' } },
  {
    $lookup: {
      from: CandidateProfileDraft.collection.name,
      localField: '_id',
      foreignField: 'employeeId',
      as: 'draftDocs',
    },
  },
  {
    $addFields: {
      draft: { $arrayElemAt: ['$draftDocs', 0] },
    },
  },
  {
    $lookup: {
      from: Application.collection.name,
      localField: '_id',
      foreignField: 'employeeId',
      as: 'applications',
    },
  },
  {
    $addFields: {
      applicationCount: { $size: '$applications' },
      latestApplication: {
        $arrayElemAt: [
          {
            $sortArray: {
              input: '$applications',
              sortBy: { createdAt: -1 },
            },
          },
          0,
        ],
      },
    },
  },
  {
    $addFields: {
      latestApplicationStatus: '$latestApplication.status',
      profileStatusResolved: {
        $ifNull: [
          '$profileStatus',
          {
            $ifNull: ['$draft.profileStatus', '$profileReviewStatus'],
          },
        ],
      },
    },
  },
];

export const searchCandidates = async (params: CandidateSearchParams) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
  const skip = (page - 1) * limit;

  const matchStage = buildCandidateMatch(params);

  const pipeline: PipelineStage[] = [
    ...basePipeline,
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    { $sort: { updatedAt: -1 as const } },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Employee.aggregate(pipeline);
  const items = result?.items || [];
  const total = result?.total?.[0]?.count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    candidates: items.map(formatCandidateListItem),
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const formatCandidateListItem = (doc: Record<string, unknown>) => {
  const draft = doc.draft as Record<string, unknown> | undefined;
  const extractedData = sanitizeAiExtractedData(
    (draft?.extractedData as Parameters<typeof sanitizeAiExtractedData>[0]) ||
      (doc.profileReviewData as Parameters<typeof sanitizeAiExtractedData>[0])
  );

  const profileStatus = normalizeProfileStatus(
    (doc.profileStatus as string) ||
      (draft?.profileStatus as string) ||
      (doc.profileReviewStatus as string) ||
      (draft?.reviewStatus as string)
  );

  return {
    id: doc._id,
    name: (doc.name as string) || extractedData.fullName || 'Unknown',
    email: doc.email as string,
    phone: (doc.phoneNumber as string) || extractedData.phone,
    location: (doc.location as string) || extractedData.location,
    profileStatus,
    isSearchable: isSearchableProfileStatus(profileStatus),
    approvedAt:
      (doc.profileApprovedAt as Date) ||
      (draft?.approvedAt as Date) ||
      undefined,
    professionalSummary:
      extractedData.professionalSummary || (doc.about as string),
    skills: (doc.skills as string[])?.length
      ? (doc.skills as string[])
      : extractedData.skills,
    interviewSkills: extractedData.interviewSkills,
    education: extractedData.education,
    experience: extractedData.experience,
    languages: (doc.languages as string[])?.length
      ? (doc.languages as string[])
      : extractedData.languages,
    certifications: extractedData.certifications,
    yearsOfExperience: extractedData.yearsOfExperience,
    linkedInUrl: extractedData.linkedInUrl,
    githubUrl: extractedData.githubUrl,
    portfolioUrl: extractedData.portfolioUrl,
    applicationCount: (doc.applicationCount as number) || 0,
    latestApplicationStatus: doc.latestApplicationStatus
      ? normalizeApplicationStatus(doc.latestApplicationStatus as string)
      : undefined,
    cvId: (doc.primaryCvId as Types.ObjectId) || (draft?.cvId as Types.ObjectId),
    extractedAt: draft?.extractedAt as Date | undefined,
  };
};

export const getCandidateIntelligenceById = async (employeeId: string) => {
  if (!Types.ObjectId.isValid(employeeId)) {
    throw Object.assign(new Error('Invalid candidate ID'), { statusCode: 400 });
  }

  const employee = await Employee.findById(employeeId).select('-password');
  if (!employee) {
    throw Object.assign(new Error('Candidate not found'), { statusCode: 404 });
  }

  const [draft, applications] = await Promise.all([
    CandidateProfileDraft.findOne({ employeeId }),
    Application.find({ employeeId })
      .populate('jobId', 'title status')
      .sort({ createdAt: -1 }),
  ]);

  const cvId = employee.primaryCvId || draft?.cvId;
  const cvDoc = cvId ? await CvDocument.findById(cvId) : null;

  const extractedData = sanitizeAiExtractedData(
    draft?.extractedData || employee.profileReviewData
  );

  const profileStatus = normalizeProfileStatus(
    employee.profileStatus ||
      draft?.profileStatus ||
      employee.profileReviewStatus ||
      draft?.reviewStatus
  );

  return {
    id: employee._id,
    name: employee.name || extractedData.fullName,
    email: employee.email,
    phone: employee.phoneNumber || extractedData.phone,
    location: employee.location || extractedData.location,
    about: employee.about || extractedData.professionalSummary,
    profileStatus,
    isSearchable: isSearchableProfileStatus(profileStatus),
    approvedAt: employee.profileApprovedAt || draft?.approvedAt,
    extractedAt: draft?.extractedAt,
    confidenceScores: draft?.confidenceScores || {},
    profile: {
      ...extractedData,
      skills: employee.skills?.length ? employee.skills : extractedData.skills,
      languages: employee.languages?.length
        ? employee.languages
        : extractedData.languages,
      certifications: employee.certificates?.length
        ? employee.certificates
        : extractedData.certifications,
      education: employee.education
        ? employee.education.split('\n').filter(Boolean)
        : extractedData.education,
      experience: employee.experience
        ? employee.experience.split('\n').filter(Boolean)
        : extractedData.experience,
    },
    cv: cvDoc
      ? {
          id: cvDoc._id,
          fileName: cvDoc.fileName,
          fileUrl: cvDoc.fileUrl,
          fileSize: cvDoc.fileSize,
          mimeType: cvDoc.mimeType,
          uploadedAt: cvDoc.uploadedAt,
          version: cvDoc.version,
          parseStatus: cvDoc.parseStatus,
          aiProvider: cvDoc.aiProvider,
          extractionSummary: cvDoc.extractedData,
        }
      : null,
    applications: applications.map((app) => ({
      id: app._id,
      jobId:
        app.jobId && typeof app.jobId === 'object' && 'title' in app.jobId
          ? {
              id: (app.jobId as { _id?: Types.ObjectId })._id,
              title: (app.jobId as { title?: string }).title,
            }
          : app.jobId,
      status: normalizeApplicationStatus(app.status),
      appliedAt: app.createdAt,
      profileSnapshot: app.profileSnapshot,
      cvId: app.cvId,
      resume: app.resume,
    })),
    applicationCount: applications.length,
  };
};
