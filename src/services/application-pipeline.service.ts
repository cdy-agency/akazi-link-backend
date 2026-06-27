import Application from '../models/Application';
import AdminNotification from '../models/AdminNotification';
import {
  ApplicationStatus,
  normalizeApplicationStatus,
} from '../config/application.config';
import { AUDIT_ACTIONS } from '../config/pipeline.config';
import { logAudit } from './audit.service';

export const pushApplicationNotification = async (
  applicationId: string,
  message: string
) => {
  await Application.findByIdAndUpdate(applicationId, {
    $push: {
      notifications: {
        message,
        read: false,
        createdAt: new Date(),
      },
    },
  });
};

export const notifyAdminPipeline = async (message: string) => {
  try {
    await AdminNotification.create({
      message,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to create admin pipeline notification', error);
  }
};

export const updateApplicationPipelineStatus = async ({
  applicationId,
  nextStatus,
  actorId,
  message,
  jobTitle,
  applicantName,
}: {
  applicationId: string;
  nextStatus: ApplicationStatus;
  actorId?: string;
  message?: string;
  jobTitle?: string;
  applicantName?: string;
}) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw Object.assign(new Error('Application not found'), { statusCode: 404 });
  }

  const previousStatus = normalizeApplicationStatus(application.status);
  application.status = nextStatus;

  if (nextStatus === 'HIRED') {
    application.hiredAt = new Date();
  }

  const notificationMessage =
    message ||
    `Your application for ${jobTitle || 'the position'} is now: ${nextStatus.replace(/_/g, ' ')}`;

  application.notifications.push({
    message: notificationMessage,
    read: false,
    createdAt: new Date(),
  } as any);

  await application.save();

  await logAudit({
    actorId,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entityType: 'Application',
    entityId: applicationId,
    metadata: {
      previousStatus,
      nextStatus,
      message,
    },
  });

  if (nextStatus === 'SELECTED') {
    await pushApplicationNotification(
      applicationId,
      `Congratulations! You have been selected for ${jobTitle || 'the role'}.`
    );
    await notifyAdminPipeline(
      `Candidate selected: ${applicantName || 'Applicant'} for ${jobTitle || 'a job'}`
    );
  }

  if (nextStatus === 'HIRED') {
    await notifyAdminPipeline(
      `Candidate hired: ${applicantName || 'Applicant'} for ${jobTitle || 'a job'}`
    );
  }

  return application;
};

export const markApplicationHired = async ({
  applicationId,
  actorId,
  message,
  jobTitle,
  applicantName,
}: {
  applicationId: string;
  actorId?: string;
  message?: string;
  jobTitle?: string;
  applicantName?: string;
}) => {
  const application = await updateApplicationPipelineStatus({
    applicationId,
    nextStatus: 'HIRED',
    actorId,
    message:
      message ||
      `Congratulations! You have been hired for ${jobTitle || 'the position'}.`,
    jobTitle,
    applicantName,
  });

  await logAudit({
    actorId,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.CANDIDATE_HIRED,
    entityType: 'Application',
    entityId: applicationId,
    metadata: { jobTitle, applicantName },
  });

  return application;
};
