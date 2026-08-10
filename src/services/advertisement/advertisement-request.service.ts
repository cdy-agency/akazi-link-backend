import { z } from 'zod';
import { Types } from 'mongoose';
import AdminNotification from '../../models/AdminNotification';
import {
  AdvertisementRequestModel,
  ADVERTISEMENT_REQUEST_STATUSES,
  type AdvertisementRequestStatus,
} from '../../models/AdvertisementRequest';
import {
  ADVERTISEMENT_PLACEMENTS,
  normalizeAdvertisementPlacement,
  type AdvertisementPlacement,
} from '../../config/advertisement.config';
import { emailService } from '../email/email.service';
import { EmailTemplate } from '../email/email.types';
import { createAdvertisement } from './advertisement.service';

export const advertisementRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(40),
  message: z.string().trim().min(20).max(4000),
  linkUrl: z
    .string()
    .trim()
    .url()
    .max(2000)
    .optional()
    .or(z.literal('')),
  packageType: z.enum(['FREE', 'PREMIUM']).default('FREE'),
  mediaUrl: z.string().trim().url().max(2000),
  cloudinaryPublicId: z.string().trim().max(400).optional().or(z.literal('')),
  mediaType: z.literal('IMAGE'),
});

export type AdvertisementRequestInput = z.infer<
  typeof advertisementRequestSchema
>;

export async function submitAdvertisementRequest(
  input: AdvertisementRequestInput
) {
  const email = input.email.trim().toLowerCase();

  const request = await AdvertisementRequestModel.create({
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    placements: [],
    message: input.message.trim(),
    linkUrl: input.linkUrl?.trim() || undefined,
    packageType: input.packageType || 'FREE',
    mediaUrl: input.mediaUrl.trim(),
    cloudinaryPublicId: input.cloudinaryPublicId?.trim() || undefined,
    mediaType: input.mediaType,
    status: 'PENDING',
  });

  await AdminNotification.create({
    message: `New free image ad request from ${input.name} (${email}) — place & publish from Ad Requests`,
    read: false,
    createdAt: new Date(),
  });

  const adminEmail =
    process.env.ADMIN_EMAIL ||
    process.env.SUPERADMIN_EMAIL ||
    process.env.SMTP_USER;

  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || '';

  if (adminEmail) {
    try {
      await emailService.send({
        to: adminEmail,
        template: EmailTemplate.ADVERTISEMENT_REQUEST_ADMIN,
        data: {
          name: input.name.trim(),
          email,
          phone: input.phone.trim(),
          message: input.message.trim(),
          linkUrl: input.linkUrl?.trim() || undefined,
          mediaUrl: input.mediaUrl.trim(),
          mediaType: input.mediaType,
          packageType: 'FREE',
          placements: [],
        },
      });
    } catch (error) {
      console.error('Failed to send advertisement request admin email', error);
    }
  }

  try {
    await emailService.send({
      to: email,
      template: EmailTemplate.ADVERTISEMENT_REQUEST_SUBMITTED,
      data: {
        name: input.name.trim(),
        packageType: 'FREE',
        placements: [],
        homeUrl: appUrl || undefined,
      },
    });
  } catch (error) {
    console.error(
      'Failed to send advertisement request confirmation email',
      error
    );
  }

  return { ok: true, id: request._id };
}

export async function listAdvertisementRequests(options: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const filter: Record<string, unknown> = {};

  if (
    options.status &&
    (ADVERTISEMENT_REQUEST_STATUSES as readonly string[]).includes(
      options.status
    )
  ) {
    filter.status = options.status;
  }

  const [items, total] = await Promise.all([
    AdvertisementRequestModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AdvertisementRequestModel.countDocuments(filter),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export type UpdateAdvertisementRequestStatusInput = {
  status: AdvertisementRequestStatus;
  adminNote?: string;
  /** Required when approving — campaign start. */
  startDate?: string | Date;
  /** Required when approving — campaign expiration. */
  endDate?: string | Date;
  /** Required when approving — where the ad will appear. */
  placement?: string;
  createdBy: string;
};

function parseRequiredSchedule(input: {
  startDate?: string | Date;
  endDate?: string | Date;
  placement?: string;
}) {
  const startDate = input.startDate ? new Date(input.startDate) : null;
  const endDate = input.endDate ? new Date(input.endDate) : null;
  const placement = normalizeAdvertisementPlacement(
    String(input.placement || '')
  );

  if (!startDate || Number.isNaN(startDate.getTime())) {
    throw Object.assign(new Error('Start date is required'), { statusCode: 400 });
  }
  if (!endDate || Number.isNaN(endDate.getTime())) {
    throw Object.assign(new Error('End / expiration date is required'), {
      statusCode: 400,
    });
  }
  if (endDate.getTime() <= startDate.getTime()) {
    throw Object.assign(new Error('End date must be after start date'), {
      statusCode: 400,
    });
  }
  if (
    !placement ||
    !(ADVERTISEMENT_PLACEMENTS as readonly string[]).includes(placement)
  ) {
    throw Object.assign(
      new Error(
        `Placement must be one of: ${ADVERTISEMENT_PLACEMENTS.join(', ')}`
      ),
      { statusCode: 400 }
    );
  }

  return {
    startDate,
    endDate,
    placement: placement as AdvertisementPlacement,
  };
}

export async function updateAdvertisementRequestStatus(
  id: string,
  input: UpdateAdvertisementRequestStatusInput
) {
  const { status, adminNote, createdBy } = input;

  if (!(ADVERTISEMENT_REQUEST_STATUSES as readonly string[]).includes(status)) {
    throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
  }
  if (status === 'PENDING') {
    throw Object.assign(new Error('Cannot set status back to PENDING'), {
      statusCode: 400,
    });
  }

  const existing = await AdvertisementRequestModel.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Advertisement request not found'), {
      statusCode: 404,
    });
  }
  if (existing.status !== 'PENDING') {
    throw Object.assign(new Error('Request was already reviewed'), {
      statusCode: 400,
    });
  }

  const note = adminNote?.trim() || undefined;
  let advertisementId: string | undefined;
  let schedule:
    | { startDate: Date; endDate: Date; placement: AdvertisementPlacement }
    | undefined;

  if (status === 'APPROVED') {
    schedule = parseRequiredSchedule(input);

    if (!existing.mediaUrl) {
      throw Object.assign(
        new Error('Cannot approve: request has no media to publish'),
        { statusCode: 400 }
      );
    }

    const mediaType =
      existing.mediaType === 'GIF' || existing.mediaType === 'VIDEO'
        ? existing.mediaType
        : 'IMAGE';

    const advertisement = await createAdvertisement(
      {
        title: `${existing.name}'s ad`.trim() || 'Advertisement',
        description: existing.message?.trim()?.slice(0, 2000) || undefined,
        mediaType,
        mediaUrl: existing.mediaUrl,
        cloudinaryPublicId: existing.cloudinaryPublicId || undefined,
        placement: schedule.placement,
        buttonText: 'Learn more',
        buttonLink: existing.linkUrl || undefined,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      },
      createdBy
    );

    advertisementId = String(
      (advertisement as { _id?: unknown })._id || ''
    );
  }

  existing.status = status;
  existing.adminNote = note;
  existing.reviewedAt = new Date();
  if (schedule) {
    existing.startDate = schedule.startDate;
    existing.endDate = schedule.endDate;
    existing.placement = schedule.placement;
  }
  if (advertisementId) {
    existing.advertisementId = new Types.ObjectId(advertisementId);
  }
  await existing.save();

  const updated = existing.toObject();

  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || '';
  const applicantEmail =
    typeof updated.email === 'string' ? updated.email.trim().toLowerCase() : '';

  if (applicantEmail) {
    const template =
      status === 'APPROVED'
        ? EmailTemplate.ADVERTISEMENT_REQUEST_APPROVED
        : EmailTemplate.ADVERTISEMENT_REQUEST_REJECTED;

    try {
      await emailService.send({
        to: applicantEmail,
        template,
        data: {
          name: updated.name,
          adminNote: note,
          homeUrl: appUrl || undefined,
          startDate: schedule?.startDate?.toISOString(),
          endDate: schedule?.endDate?.toISOString(),
        },
      });
    } catch (error) {
      console.error(
        'Failed to send advertisement request status email',
        error
      );
    }
  }

  return updated;
}
