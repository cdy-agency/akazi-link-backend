import { z } from 'zod';
import { ADVERTISEMENT_PLACEMENTS } from '../../config/advertisement.config';
import AdminNotification from '../../models/AdminNotification';
import {
  AdvertisementRequestModel,
  ADVERTISEMENT_REQUEST_STATUSES,
  type AdvertisementRequestStatus,
} from '../../models/AdvertisementRequest';
import { emailService } from '../email/email.service';
import { EmailTemplate } from '../email/email.types';

const PLACEMENT_META: Record<
  (typeof ADVERTISEMENT_PLACEMENTS)[number],
  { label: string; recommendedSize: string }
> = {
  TOPBAR: { label: 'Top navbar', recommendedSize: '1200 × 96 px' },
  HERO: { label: 'Homepage hero', recommendedSize: '480 × 420 px' },
  HOME_SECTION: {
    label: 'Home section carousel',
    recommendedSize: '600 × 480 px',
  },
  FOOTER: { label: 'Footer banner', recommendedSize: '1200 × 96 px' },
};

export const advertisementRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(40),
  companyName: z.string().trim().max(160).optional().or(z.literal('')),
  placements: z
    .array(z.enum(ADVERTISEMENT_PLACEMENTS))
    .min(1, 'Select at least one placement'),
  message: z.string().trim().min(20).max(4000),
});

export type AdvertisementRequestInput = z.infer<
  typeof advertisementRequestSchema
>;

export async function submitAdvertisementRequest(
  input: AdvertisementRequestInput
) {
  const placements = input.placements.map((id) => ({
    id,
    ...PLACEMENT_META[id],
  }));

  const placementLabels = placements.map((p) => p.label).join(', ');
  const companyPart = input.companyName?.trim()
    ? ` · ${input.companyName.trim()}`
    : '';

  const request = await AdvertisementRequestModel.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    companyName: input.companyName?.trim() || undefined,
    placements: input.placements,
    message: input.message.trim(),
    status: 'PENDING',
  });

  await AdminNotification.create({
    message: `New advertising request from ${input.name} (${input.email}${companyPart}) — placements: ${placementLabels}`,
    read: false,
    createdAt: new Date(),
  });

  const adminEmail =
    process.env.ADMIN_EMAIL ||
    process.env.SUPERADMIN_EMAIL ||
    process.env.SMTP_USER;

  const placementEmailData = placements.map((p) => ({
    label: p.label,
    recommendedSize: p.recommendedSize,
  }));

  if (adminEmail) {
    try {
      await emailService.send({
        to: adminEmail,
        template: EmailTemplate.ADVERTISEMENT_REQUEST_ADMIN,
        data: {
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          companyName: input.companyName?.trim() || undefined,
          message: input.message.trim(),
          placements: placementEmailData,
        },
      });
    } catch (error) {
      console.error('Failed to send advertisement request admin email', error);
    }
  }

  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || '';
  try {
    await emailService.send({
      to: input.email.trim().toLowerCase(),
      template: EmailTemplate.ADVERTISEMENT_REQUEST_SUBMITTED,
      data: {
        name: input.name.trim(),
        placements: placementEmailData,
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

export async function updateAdvertisementRequestStatus(
  id: string,
  status: AdvertisementRequestStatus,
  adminNote?: string
) {
  if (!(ADVERTISEMENT_REQUEST_STATUSES as readonly string[]).includes(status)) {
    throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
  }
  if (status === 'PENDING') {
    throw Object.assign(new Error('Cannot set status back to PENDING'), {
      statusCode: 400,
    });
  }

  const updated = await AdvertisementRequestModel.findByIdAndUpdate(
    id,
    {
      status,
      adminNote: adminNote?.trim() || undefined,
      reviewedAt: new Date(),
    },
    { new: true }
  ).lean();

  if (!updated) {
    throw Object.assign(new Error('Advertisement request not found'), {
      statusCode: 404,
    });
  }

  return updated;
}

export { PLACEMENT_META };
