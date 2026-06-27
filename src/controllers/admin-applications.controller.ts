/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Application from '../models/Application';
import Job from '../models/Job';
import Employee from '../models/Employee';
import AdminNotification from '../models/AdminNotification';
import {
  APPLICATION_STATUSES,
  ApplicationStatus,
  isApplicationStatus,
  normalizeApplicationStatus,
  statusFilterValues,
} from '../config/application.config';
import {
  markApplicationHired,
  updateApplicationPipelineStatus,
} from '../services/application-pipeline.service';
import { emailService } from '../services/email/email.service';
import {
  EmailTemplate,
  LegacyEmailTemplate,
} from '../services/email/email.types';

const EMPLOYEE_FIELDS =
  'name email phoneNumber location about profileImage documents';
const JOB_FIELDS = 'title status province district';
const CV_FIELDS = 'fileName fileUrl fileSize mimeType uploadedAt version';

const formatApplication = (application: InstanceType<typeof Application>) => {
  const doc = application.toObject();
  return {
    ...doc,
    status: normalizeApplicationStatus(doc.status),
  };
};

const findApplications = (filter: Record<string, unknown> = {}) =>
  Application.find(filter)
    .populate('employeeId', EMPLOYEE_FIELDS)
    .populate('jobId', JOB_FIELDS)
    .populate('cvId', CV_FIELDS);

const findApplicationById = (id: string) =>
  Application.findById(id)
    .populate('employeeId', EMPLOYEE_FIELDS)
    .populate('jobId', JOB_FIELDS)
    .populate('cvId', CV_FIELDS);

const buildStatusFilter = (statusParam: unknown) => {
  if (typeof statusParam !== 'string' || !statusParam.trim()) {
    return undefined;
  }
  const normalized = normalizeApplicationStatus(statusParam);
  return { status: { $in: statusFilterValues(normalized) } };
};

const paginateApplications = async (
  filter: Record<string, unknown>,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const [applications, total] = await Promise.all([
    findApplications(filter)
      .sort({ matchScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    applications: applications.map(formatApplication),
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

export const listAdminApplications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const { jobId } = req.query as { jobId?: string };

    const filter: Record<string, unknown> = {};
    if (jobId) {
      if (!Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ message: 'Invalid Job ID' });
      }
      filter.jobId = jobId;
    }

    const statusFilter = buildStatusFilter(req.query.status);
    if (statusFilter) {
      Object.assign(filter, statusFilter);
    }

    const result = await paginateApplications(filter, page, limit);

    res.status(200).json({
      message: 'Applications retrieved successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error listing admin applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listAdminJobApplications = async (
  req: Request,
  res: Response
) => {
  try {
    const { jobId } = req.params;

    if (!Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const filter: Record<string, unknown> = { jobId };
    const statusFilter = buildStatusFilter(req.query.status);
    if (statusFilter) {
      Object.assign(filter, statusFilter);
    }

    const result = await paginateApplications(filter, page, limit);

    res.status(200).json({
      message: 'Applications retrieved successfully',
      job: { id: job._id, title: job.title },
      ...result,
    });
  } catch (error) {
    console.error('Error listing job applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminApplicationById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Application ID' });
    }

    const application = await findApplicationById(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json({
      message: 'Application retrieved successfully',
      application: formatApplication(application),
    });
  } catch (error) {
    console.error('Error getting admin application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminApplicationStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body as {
      status?: string;
      message?: string;
    };

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Application ID' });
    }

    if (!status || !isApplicationStatus(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${APPLICATION_STATUSES.join(', ')}`,
      });
    }

    const nextStatus = normalizeApplicationStatus(status);
    const customMessage =
      typeof message === 'string' && message.trim().length > 0
        ? message.trim()
        : undefined;

    if (
      (nextStatus === 'HIRED' || nextStatus === 'REJECTED') &&
      !customMessage
    ) {
      return res
        .status(400)
        .json({ message: 'A custom message is required for HIRED or REJECTED' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const employee = await Employee.findById(application.employeeId).select(
      'name email'
    );

    if (nextStatus === 'HIRED') {
      await markApplicationHired({
        applicationId: id,
        actorId: req.user?.id,
        message: customMessage,
        jobTitle: job.title,
        applicantName: employee?.name,
      });
    } else {
      await updateApplicationPipelineStatus({
        applicationId: id,
        nextStatus,
        actorId: req.user?.id,
        message: customMessage,
        jobTitle: job.title,
        applicantName: employee?.name,
      });
    }

    const updatedApplication = await Application.findById(id);
    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (customMessage) {
      try {
        if (employee?.email) {
          if (nextStatus === 'HIRED') {
            await emailService.send({
              to: employee.email,
              template: LegacyEmailTemplate.HIRED_NOTIFICATION,
              data: {
                employeeName: employee.name,
                companyName: process.env.PLATFORM_NAME || 'Imihigo',
                jobTitle: job.title,
                customMessage,
                logo: process.env.APP_LOGO || '',
              },
            });
          } else if (nextStatus === 'REJECTED') {
            await emailService.send({
              to: employee.email,
              template: LegacyEmailTemplate.GENERIC_MESSAGE,
              data: {
                contactName: employee.name,
                subject: `Application status updated: Rejected`,
                content: customMessage,
                logo: process.env.APP_LOGO || '',
                platformName: process.env.PLATFORM_NAME || 'Imihigo Recruitment',
              },
            });
          }
        }
      } catch (emailErr) {
        console.error('Failed to send application status email', emailErr);
      }
    }

    const populated = await findApplicationById(String(updatedApplication._id));

    res.status(200).json({
      message: 'Application status updated',
      application: formatApplication(populated!),
    });
  } catch (error) {
    console.error('Error updating admin application status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const notifyAdminOfNewApplication = async ({
  applicantName,
  applicantEmail,
  jobTitle,
  jobId,
  experience,
  coverLetter,
  resumeLink,
}: {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobId: string;
  experience?: string;
  coverLetter?: string;
  resumeLink?: string;
}) => {
  const adminEmail =
    process.env.SUPERADMIN_EMAIL || process.env.SMTP_USER || '';

  if (adminEmail) {
    try {
      await emailService.send({
        to: adminEmail,
        template: EmailTemplate.APPLICATION_RECEIVED,
        data: {
          applicantName,
          applicantEmail,
          jobTitle,
          jobId,
          experience,
          coverLetter,
          resumeLink,
        },
      });
    } catch (emailError) {
      console.error('Failed to send job application email to admin', emailError);
    }
  }

  try {
    await AdminNotification.create({
      message: `New application: ${applicantName} applied for ${jobTitle}`,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error(
      'Failed to create admin system notification for job application',
      error
    );
  }
};
