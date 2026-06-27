import { Types } from 'mongoose';
import Interview from '../models/Interview';
import Application from '../models/Application';
import Job from '../models/Job';
import Employee from '../models/Employee';
import {
  INTERVIEW_RECOMMENDATIONS,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
  AUDIT_ACTIONS,
} from '../config/pipeline.config';
import { logAudit } from './audit.service';
import {
  pushApplicationNotification,
  notifyAdminPipeline,
  updateApplicationPipelineStatus,
} from './application-pipeline.service';

const EMPLOYEE_FIELDS = 'name email';
const JOB_FIELDS = 'title';
const APPLICATION_FIELDS = 'status employeeId jobId';

export interface ScheduleInterviewInput {
  applicationId: string;
  scheduledDate: Date;
  interviewType: InterviewType;
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdBy?: string;
}

export interface CompleteInterviewInput {
  interviewId: string;
  technicalScore?: number;
  communicationScore?: number;
  professionalismScore?: number;
  overallScore?: number;
  notes?: string;
  recommendation?: InterviewRecommendation;
  actorId?: string;
}

export const listInterviews = async (filter: Record<string, unknown> = {}) => {
  return Interview.find(filter)
    .populate('candidateId', EMPLOYEE_FIELDS)
    .populate('jobId', JOB_FIELDS)
    .populate('applicationId', APPLICATION_FIELDS)
    .sort({ scheduledDate: 1 });
};

export const getInterviewById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) return null;
  return Interview.findById(id)
    .populate('candidateId', EMPLOYEE_FIELDS)
    .populate('jobId', JOB_FIELDS)
    .populate('applicationId', APPLICATION_FIELDS);
};

export const scheduleInterview = async (input: ScheduleInterviewInput) => {
  const { applicationId, createdBy } = input;

  if (!Types.ObjectId.isValid(applicationId)) {
    throw Object.assign(new Error('Invalid application ID'), { statusCode: 400 });
  }

  if (!INTERVIEW_TYPES.includes(input.interviewType)) {
    throw Object.assign(new Error('Invalid interview type'), { statusCode: 400 });
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw Object.assign(new Error('Application not found'), { statusCode: 404 });
  }

  const existingScheduled = await Interview.findOne({
    applicationId,
    status: 'SCHEDULED',
  });
  if (existingScheduled) {
    throw Object.assign(
      new Error('An interview is already scheduled for this application'),
      { statusCode: 409 }
    );
  }

  const [job, employee] = await Promise.all([
    Job.findById(application.jobId).select('title'),
    Employee.findById(application.employeeId).select('name'),
  ]);

  const interview = await Interview.create({
    applicationId,
    candidateId: application.employeeId,
    jobId: application.jobId,
    scheduledDate: input.scheduledDate,
    interviewType: input.interviewType,
    meetingLink: input.meetingLink,
    location: input.location,
    notes: input.notes,
    status: 'SCHEDULED',
    createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
  });

  await updateApplicationPipelineStatus({
    applicationId,
    nextStatus: 'INTERVIEW_SCHEDULED',
    actorId: createdBy,
    jobTitle: job?.title,
    applicantName: employee?.name,
    message: `Interview scheduled for ${job?.title || 'your application'} on ${input.scheduledDate.toLocaleString()}.`,
  });

  await logAudit({
    actorId: createdBy,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.INTERVIEW_SCHEDULED,
    entityType: 'Interview',
    entityId: String(interview._id),
    metadata: { applicationId, scheduledDate: input.scheduledDate },
  });

  return getInterviewById(String(interview._id));
};

export const updateInterview = async (
  interviewId: string,
  updates: Partial<{
    scheduledDate: Date;
    meetingLink: string;
    location: string;
    interviewType: InterviewType;
    notes: string;
    status: InterviewStatus;
  }>,
  actorId?: string
) => {
  const interview = await Interview.findById(interviewId);
  if (!interview) {
    throw Object.assign(new Error('Interview not found'), { statusCode: 404 });
  }

  if (updates.interviewType && !INTERVIEW_TYPES.includes(updates.interviewType)) {
    throw Object.assign(new Error('Invalid interview type'), { statusCode: 400 });
  }

  Object.assign(interview, updates);
  await interview.save();

  const job = await Job.findById(interview.jobId).select('title');

  await pushApplicationNotification(
    String(interview.applicationId),
    `Your interview for ${job?.title || 'the position'} has been updated.`
  );

  await logAudit({
    actorId,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.INTERVIEW_UPDATED,
    entityType: 'Interview',
    entityId: interviewId,
    metadata: updates,
  });

  return getInterviewById(interviewId);
};

export const cancelInterview = async (interviewId: string, actorId?: string) => {
  const interview = await Interview.findById(interviewId);
  if (!interview) {
    throw Object.assign(new Error('Interview not found'), { statusCode: 404 });
  }

  interview.status = 'CANCELLED';
  await interview.save();

  const job = await Job.findById(interview.jobId).select('title');

  await updateApplicationPipelineStatus({
    applicationId: String(interview.applicationId),
    nextStatus: 'SHORTLISTED',
    actorId,
    jobTitle: job?.title,
    message: `Your interview for ${job?.title || 'the position'} has been cancelled.`,
  });

  await logAudit({
    actorId,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.INTERVIEW_CANCELLED,
    entityType: 'Interview',
    entityId: interviewId,
  });

  return getInterviewById(interviewId);
};

export const completeInterview = async (input: CompleteInterviewInput) => {
  const interview = await Interview.findById(input.interviewId);
  if (!interview) {
    throw Object.assign(new Error('Interview not found'), { statusCode: 404 });
  }

  if (
    input.recommendation &&
    !INTERVIEW_RECOMMENDATIONS.includes(input.recommendation)
  ) {
    throw Object.assign(new Error('Invalid recommendation'), { statusCode: 400 });
  }

  const feedback = {
    technicalScore: input.technicalScore,
    communicationScore: input.communicationScore,
    professionalismScore: input.professionalismScore,
    overallScore: input.overallScore,
    notes: input.notes,
    recommendation: input.recommendation,
  };

  interview.feedback = feedback;
  interview.score = input.overallScore;
  interview.status = 'COMPLETED';
  await interview.save();

  const [job, employee] = await Promise.all([
    Job.findById(interview.jobId).select('title'),
    Employee.findById(interview.candidateId).select('name'),
  ]);

  await updateApplicationPipelineStatus({
    applicationId: String(interview.applicationId),
    nextStatus: 'INTERVIEW_COMPLETED',
    actorId: input.actorId,
    jobTitle: job?.title,
    applicantName: employee?.name,
    message: `Interview completed for ${job?.title || 'your application'}. Feedback is available.`,
  });

  if (
    input.recommendation === 'STRONG_HIRE' ||
    input.recommendation === 'HIRE'
  ) {
    await updateApplicationPipelineStatus({
      applicationId: String(interview.applicationId),
      nextStatus: 'SELECTED',
      actorId: input.actorId,
      jobTitle: job?.title,
      applicantName: employee?.name,
    });
  } else if (input.recommendation === 'REJECT') {
    await updateApplicationPipelineStatus({
      applicationId: String(interview.applicationId),
      nextStatus: 'REJECTED',
      actorId: input.actorId,
      jobTitle: job?.title,
      applicantName: employee?.name,
      message: `Thank you for interviewing. We will not be moving forward at this time.`,
    });
  }

  await logAudit({
    actorId: input.actorId,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.INTERVIEW_COMPLETED,
    entityType: 'Interview',
    entityId: input.interviewId,
    metadata: { feedback },
  });

  return getInterviewById(input.interviewId);
};

export const listCandidateInterviews = async (candidateId: string) => {
  return Interview.find({ candidateId })
    .populate('jobId', 'title province district')
    .sort({ scheduledDate: -1 });
};

export const isInterviewStatus = (value: string): value is InterviewStatus =>
  (INTERVIEW_STATUSES as readonly string[]).includes(value);
