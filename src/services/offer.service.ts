import { Types } from 'mongoose';
import Offer from '../models/Offer';
import Application from '../models/Application';
import Job from '../models/Job';
import Employee from '../models/Employee';
import {
  OFFER_STATUSES,
  OfferStatus,
  AUDIT_ACTIONS,
} from '../config/pipeline.config';
import { logAudit } from './audit.service';
import {
  notifyAdminPipeline,
  pushApplicationNotification,
  updateApplicationPipelineStatus,
} from './application-pipeline.service';

const EMPLOYEE_FIELDS = 'name email';
const JOB_FIELDS = 'title';

export interface CreateOfferInput {
  applicationId: string;
  offerLetter?: string;
  salary?: string;
  startDate?: Date;
  notes?: string;
  createdBy?: string;
}

export const listOffers = async (filter: Record<string, unknown> = {}) => {
  return Offer.find(filter)
    .populate('candidateId', EMPLOYEE_FIELDS)
    .populate('jobId', JOB_FIELDS)
    .populate('applicationId', 'status')
    .sort({ createdAt: -1 });
};

export const getOfferById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) return null;
  return Offer.findById(id)
    .populate('candidateId', EMPLOYEE_FIELDS)
    .populate('jobId', JOB_FIELDS)
    .populate('applicationId', 'status');
};

export const createOffer = async (input: CreateOfferInput) => {
  const { applicationId, createdBy } = input;

  if (!Types.ObjectId.isValid(applicationId)) {
    throw Object.assign(new Error('Invalid application ID'), { statusCode: 400 });
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw Object.assign(new Error('Application not found'), { statusCode: 404 });
  }

  const offer = await Offer.create({
    applicationId,
    candidateId: application.employeeId,
    jobId: application.jobId,
    offerStatus: 'DRAFT',
    offerLetter: input.offerLetter,
    salary: input.salary,
    startDate: input.startDate,
    notes: input.notes,
    createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
  });

  await logAudit({
    actorId: createdBy,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.OFFER_CREATED,
    entityType: 'Offer',
    entityId: String(offer._id),
    metadata: { applicationId },
  });

  return getOfferById(String(offer._id));
};

export const sendOffer = async (offerId: string, actorId?: string) => {
  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw Object.assign(new Error('Offer not found'), { statusCode: 404 });
  }

  offer.offerStatus = 'SENT';
  offer.sentAt = new Date();
  await offer.save();

  const [job, employee] = await Promise.all([
    Job.findById(offer.jobId).select('title'),
    Employee.findById(offer.candidateId).select('name'),
  ]);

  await updateApplicationPipelineStatus({
    applicationId: String(offer.applicationId),
    nextStatus: 'OFFER_SENT',
    actorId,
    jobTitle: job?.title,
    applicantName: employee?.name,
    message: `You have received a job offer for ${job?.title || 'the position'}. Please review and respond.`,
  });

  await logAudit({
    actorId,
    actorRole: 'superadmin',
    action: AUDIT_ACTIONS.OFFER_SENT,
    entityType: 'Offer',
    entityId: offerId,
  });

  return getOfferById(offerId);
};

export const respondToOffer = async (
  offerId: string,
  response: 'ACCEPTED' | 'DECLINED',
  candidateId: string
) => {
  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw Object.assign(new Error('Offer not found'), { statusCode: 404 });
  }

  if (String(offer.candidateId) !== String(candidateId)) {
    throw Object.assign(new Error('Access denied'), { statusCode: 403 });
  }

  if (offer.offerStatus !== 'SENT') {
    throw Object.assign(new Error('Offer is not open for response'), {
      statusCode: 400,
    });
  }

  offer.offerStatus = response;
  offer.respondedAt = new Date();
  await offer.save();

  const [job, employee] = await Promise.all([
    Job.findById(offer.jobId).select('title'),
    Employee.findById(offer.candidateId).select('name'),
  ]);

  if (response === 'ACCEPTED') {
    await pushApplicationNotification(
      String(offer.applicationId),
      `You accepted the offer for ${job?.title || 'the position'}. The hiring team will finalize your hire.`
    );
    await notifyAdminPipeline(
      `${employee?.name || 'Candidate'} accepted the offer for ${job?.title || 'a job'}`
    );
    await logAudit({
      actorId: candidateId,
      actorRole: 'employee',
      action: AUDIT_ACTIONS.OFFER_ACCEPTED,
      entityType: 'Offer',
      entityId: offerId,
    });
  } else {
    await updateApplicationPipelineStatus({
      applicationId: String(offer.applicationId),
      nextStatus: 'REJECTED',
      actorId: candidateId,
      jobTitle: job?.title,
      message: `You declined the offer for ${job?.title || 'the position'}.`,
    });
    await notifyAdminPipeline(
      `${employee?.name || 'Candidate'} declined the offer for ${job?.title || 'a job'}`
    );
    await logAudit({
      actorId: candidateId,
      actorRole: 'employee',
      action: AUDIT_ACTIONS.OFFER_DECLINED,
      entityType: 'Offer',
      entityId: offerId,
    });
  }

  return getOfferById(offerId);
};

export const listCandidateOffers = async (candidateId: string) => {
  return Offer.find({ candidateId, offerStatus: { $ne: 'DRAFT' } })
    .populate('jobId', 'title province district')
    .sort({ createdAt: -1 });
};

export const isOfferStatus = (value: string): value is OfferStatus =>
  (OFFER_STATUSES as readonly string[]).includes(value);
