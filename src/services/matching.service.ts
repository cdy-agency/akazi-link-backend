import {
  EDUCATION_KEYWORDS,
  LANGUAGE_KEYWORDS,
  MATCH_WEIGHTS,
  MIN_RECOMMENDATION_SCORE,
  RECOMMENDED_CANDIDATES_LIMIT,
  RECOMMENDED_JOBS_LIMIT,
} from '../config/matching.config';
import { SEARCHABLE_PROFILE_STATUS } from '../config/profile-status.config';
import Application from '../models/Application';
import Job from '../models/Job';
import Employee from '../models/Employee';
import CvDocument from '../models/CvDocument';
import {
  ICandidateProfileForMatch,
  IJobRequirementsForMatch,
  IMatchBreakdown,
  IMatchResult,
  ProfileSnapshotForMatch,
} from '../types/matching.types';
import { IJob } from '../types/models';
import { buildApplicationProfileSnapshot } from './profile-draft.service';

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const unique = (items: string[]): string[] =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const containsToken = (haystack: string[], needle: string): boolean => {
  const n = normalize(needle);
  if (!n) return false;
  return haystack.some(
    (item) => {
      const h = normalize(item);
      return h.includes(n) || n.includes(h);
    }
  );
};

const listOverlapScore = (
  required: string[],
  candidate: string[]
): { score: number; matched: string[] } => {
  if (!required.length) {
    return { score: 100, matched: [] };
  }
  const matched = required.filter((req) => containsToken(candidate, req));
  return {
    score: Math.round((matched.length / required.length) * 100),
    matched,
  };
};

const parseYearsFromText = (text?: string): number | undefined => {
  if (!text) return undefined;
  const match = text.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i);
  if (match) return parseInt(match[1], 10);
  const plusMatch = text.match(/(\d+)\s*\+/);
  if (plusMatch) return parseInt(plusMatch[1], 10);
  return undefined;
};

const extractKeywordsFromText = (
  text: string,
  keywords: string[]
): string[] => {
  const normalized = normalize(text);
  return keywords.filter((keyword) => normalized.includes(keyword));
};

const scoreExperience = (
  job: IJobRequirementsForMatch,
  profile: ICandidateProfileForMatch
): { score: number; matched: string[]; details?: string } => {
  const jobText = [job.experience, job.description].filter(Boolean).join(' ');
  const requiredYears = parseYearsFromText(jobText);
  const candidateYears = profile.yearsOfExperience;

  let yearsScore = 100;
  if (requiredYears != null && candidateYears != null) {
    yearsScore =
      candidateYears >= requiredYears
        ? 100
        : Math.round((candidateYears / requiredYears) * 100);
  } else if (requiredYears != null && candidateYears == null) {
    yearsScore = 40;
  }

  const experienceCorpus = unique([
    ...profile.experience,
    ...(candidateYears != null ? [`${candidateYears} years experience`] : []),
  ]);

  const keywordScore = jobText.trim()
    ? listOverlapScore(
        jobText
          .split(/[\n,;]+/)
          .map((part) => part.trim())
          .filter((part) => part.length > 2),
        experienceCorpus
      )
    : { score: 100, matched: [] as string[] };

  const score = Math.round(yearsScore * 0.6 + keywordScore.score * 0.4);
  const matched = keywordScore.matched;
  const details =
    requiredYears != null && candidateYears != null
      ? `${candidateYears} years vs ${requiredYears}+ required`
      : undefined;

  return { score, matched, details };
};

const scoreEducation = (
  job: IJobRequirementsForMatch,
  profile: ICandidateProfileForMatch
) => {
  const jobText = [job.description, job.experience, job.category]
    .filter(Boolean)
    .join(' ');
  const required = extractKeywordsFromText(jobText, EDUCATION_KEYWORDS);
  if (!required.length) {
    return { score: 100, matched: [] as string[] };
  }
  const matched = required.filter((req) =>
    profile.education.some((edu) => normalize(edu).includes(req))
  );
  return {
    score: Math.round((matched.length / required.length) * 100),
    matched,
  };
};

const scoreLanguages = (
  job: IJobRequirementsForMatch,
  profile: ICandidateProfileForMatch
) => {
  const jobText = [job.description, ...(job.skills || [])].join(' ');
  const required = unique([
    ...extractKeywordsFromText(jobText, LANGUAGE_KEYWORDS),
    ...job.skills.filter((skill) =>
      LANGUAGE_KEYWORDS.some((lang) => normalize(skill).includes(lang))
    ),
  ]);
  if (!required.length) {
    return { score: 100, matched: [] as string[] };
  }
  const matched = required.filter((req) =>
    profile.languages.some((lang) => normalize(lang).includes(req))
  );
  return {
    score: Math.round((matched.length / required.length) * 100),
    matched,
  };
};

const scoreCertifications = (
  job: IJobRequirementsForMatch,
  profile: ICandidateProfileForMatch
) => {
  const required = unique([
    ...job.skills,
    ...extractKeywordsFromText(job.description || '', [
      'aws',
      'azure',
      'google cloud',
      'pmp',
      'scrum',
      'cisco',
      'comptia',
    ]),
  ]);
  if (!required.length) {
    return { score: 100, matched: [] as string[] };
  }
  const candidatePool = unique([
    ...profile.certifications,
    ...profile.skills,
  ]);
  const matched = required.filter((req) => containsToken(candidatePool, req));
  return {
    score: Math.round((matched.length / required.length) * 100),
    matched,
  };
};

export const profileSnapshotToMatchProfile = (
  snapshot: ProfileSnapshotForMatch
): ICandidateProfileForMatch => ({
  skills: snapshot.skills || [],
  interviewSkills: snapshot.interviewSkills || [],
  education: snapshot.education || [],
  experience: snapshot.experience || [],
  languages: snapshot.languages || [],
  certifications: snapshot.certifications || [],
  location: snapshot.location,
  yearsOfExperience: snapshot.yearsOfExperience,
});

export const jobToRequirements = (job: IJob): IJobRequirementsForMatch => ({
  skills: job.skills || [],
  experience: job.experience,
  description: job.description,
  province: job.province,
  district: job.district,
  category: job.category,
});

export const calculateMatchScore = (
  profile: ICandidateProfileForMatch,
  job: IJobRequirementsForMatch
): IMatchResult => {
  const candidateSkills = unique([
    ...profile.skills,
    ...profile.interviewSkills,
  ]);

  const skillsResult = listOverlapScore(job.skills || [], candidateSkills);
  const experienceResult = scoreExperience(job, profile);
  const educationResult = scoreEducation(job, profile);
  const languagesResult = scoreLanguages(job, profile);
  const certificationsResult = scoreCertifications(job, profile);

  const breakdown: IMatchBreakdown = {
    skills: {
      score: skillsResult.score,
      weight: MATCH_WEIGHTS.skills,
      matched: skillsResult.matched,
    },
    experience: {
      score: experienceResult.score,
      weight: MATCH_WEIGHTS.experience,
      matched: experienceResult.matched,
      details: experienceResult.details,
    },
    education: {
      score: educationResult.score,
      weight: MATCH_WEIGHTS.education,
      matched: educationResult.matched,
    },
    languages: {
      score: languagesResult.score,
      weight: MATCH_WEIGHTS.languages,
      matched: languagesResult.matched,
    },
    certifications: {
      score: certificationsResult.score,
      weight: MATCH_WEIGHTS.certifications,
      matched: certificationsResult.matched,
    },
  };

  const score = Math.round(
    breakdown.skills.score * MATCH_WEIGHTS.skills +
      breakdown.experience.score * MATCH_WEIGHTS.experience +
      breakdown.education.score * MATCH_WEIGHTS.education +
      breakdown.languages.score * MATCH_WEIGHTS.languages +
      breakdown.certifications.score * MATCH_WEIGHTS.certifications
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown,
  };
};

export const calculateCandidateJobScore = (
  profile: ICandidateProfileForMatch,
  job: IJobRequirementsForMatch | IJob
): IMatchResult => {
  const requirements =
    'title' in job && (job as IJob).title
      ? jobToRequirements(job as IJob)
      : (job as IJobRequirementsForMatch);

  return calculateMatchScore(profile, requirements);
};

export const calculateJobCandidateScore = calculateCandidateJobScore;

export const loadCandidateProfileForMatch = async (
  employeeId: string
): Promise<ICandidateProfileForMatch | null> => {
  const snapshot = await buildApplicationProfileSnapshot(employeeId);
  const hasData =
    snapshot.skills?.length ||
    snapshot.education?.length ||
    snapshot.experience?.length;

  if (!hasData) return null;
  return profileSnapshotToMatchProfile(snapshot);
};

export const getRecommendedJobsForEmployee = async (
  employeeId: string,
  limit = RECOMMENDED_JOBS_LIMIT
) => {
  const profile = await loadCandidateProfileForMatch(employeeId);
  if (!profile) return [];

  const [jobs, appliedJobIds] = await Promise.all([
    Job.find({ status: 'PUBLISHED', isActive: true }),
    Application.find({ employeeId }).distinct('jobId'),
  ]);

  const appliedSet = new Set(appliedJobIds.map(String));

  const scored = jobs
    .filter((job) => !appliedSet.has(String(job._id)))
    .map((job) => {
      const match = calculateCandidateJobScore(profile, job);
      return {
        job: {
          id: job._id,
          title: job.title,
          description: job.description,
          skills: job.skills,
          province: job.province,
          district: job.district,
          employmentType: job.employmentType,
          salary: job.salary,
          category: job.category,
        },
        score: match.score,
        breakdown: match.breakdown,
        matchedSkills: match.breakdown.skills.matched,
      };
    })
    .filter((item) => item.score >= MIN_RECOMMENDATION_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
};

export const getRecommendedCandidatesForJob = async (
  jobId: string,
  limit = RECOMMENDED_CANDIDATES_LIMIT
) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  }

  const requirements = jobToRequirements(job);

  const employees = await Employee.find({
    $or: [
      { profileStatus: SEARCHABLE_PROFILE_STATUS },
      { profileReviewStatus: SEARCHABLE_PROFILE_STATUS },
    ],
  }).select('_id name email primaryCvId');

  const results = await Promise.all(
    employees.map(async (employee) => {
      const employeeId = String(employee._id);
      const profile = await loadCandidateProfileForMatch(employeeId);
      if (!profile) return null;

      const match = calculateJobCandidateScore(profile, requirements);
      const cv = employee.primaryCvId
        ? await CvDocument.findById(employee.primaryCvId)
        : null;

      return {
        candidateId: employeeId,
        name: employee.name || 'Candidate',
        email: employee.email,
        score: match.score,
        breakdown: match.breakdown,
        skills: profile.skills,
        experience: profile.experience,
        matchedSkills: match.breakdown.skills.matched,
        cvLink: cv?.fileUrl,
        cvFileName: cv?.fileName,
      };
    })
  );

  return results
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.score >= MIN_RECOMMENDATION_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
