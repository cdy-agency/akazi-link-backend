import { z } from 'zod';
import {
  ADVERTISEMENT_MEDIA_TYPES,
  ADVERTISEMENT_PLACEMENTS,
} from '../config/advertisement.config';

const dateInput = z.coerce.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date',
});

export const createAdvertisementSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    mediaType: z.enum(ADVERTISEMENT_MEDIA_TYPES),
    mediaUrl: z.string().url('Valid media URL is required'),
    cloudinaryPublicId: z.string().trim().optional().or(z.literal('')),
    placement: z.enum(ADVERTISEMENT_PLACEMENTS),
    buttonText: z.string().trim().max(80).optional().or(z.literal('')),
    buttonLink: z.string().trim().max(500).optional().or(z.literal('')),
    startDate: dateInput,
    endDate: dateInput,
  })
  .superRefine((data, ctx) => {
    if (data.endDate.getTime() <= data.startDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be greater than start date',
        path: ['endDate'],
      });
    }
  });

export const updateAdvertisementSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    mediaType: z.enum(ADVERTISEMENT_MEDIA_TYPES).optional(),
    mediaUrl: z.string().url().optional(),
    cloudinaryPublicId: z.string().trim().optional().nullable(),
    placement: z.enum(ADVERTISEMENT_PLACEMENTS).optional(),
    buttonText: z.string().trim().max(80).optional().nullable(),
    buttonLink: z.string().trim().max(500).optional().nullable(),
    startDate: dateInput.optional(),
    endDate: dateInput.optional(),
    /** DRAFT = unpublish; PUBLISHED = republish (status then follows dates) */
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  })
  .superRefine((data, ctx) => {
    const keys = Object.keys(data).filter(
      (key) => data[key as keyof typeof data] !== undefined
    );
    if (keys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field is required',
      });
    }
    if (data.startDate && data.endDate && data.endDate.getTime() <= data.startDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be greater than start date',
        path: ['endDate'],
      });
    }
  });

export const advertisementListQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'EXPIRED']).optional(),
  placement: z.enum(ADVERTISEMENT_PLACEMENTS).optional(),
  mediaType: z.enum(ADVERTISEMENT_MEDIA_TYPES).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const duplicateAdvertisementSchema = z.object({
  placement: z.enum(ADVERTISEMENT_PLACEMENTS),
  title: z.string().trim().min(1).max(200).optional(),
});

export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;
export type UpdateAdvertisementInput = z.infer<typeof updateAdvertisementSchema>;
export type AdvertisementListQuery = z.infer<typeof advertisementListQuerySchema>;
export type DuplicateAdvertisementInput = z.infer<
  typeof duplicateAdvertisementSchema
>;
