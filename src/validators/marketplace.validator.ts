import { z } from 'zod';
import { PROVIDER_TYPES } from '../config/marketplace.config';

const fileInfoSchema = z.object({
  url: z.string().url(),
  public_id: z.string(),
  format: z.string(),
  size: z.number(),
  name: z.string(),
  type: z.string(),
  time: z.string(),
});

const businessHoursSchema = z.object({
  day: z.string().min(1),
  open: z.string().min(1),
  close: z.string().min(1),
  isClosed: z.boolean().optional(),
});

export const providerRegistrationSchema = z
  .object({
    providerType: z.enum(PROVIDER_TYPES),
    categoryIds: z.array(z.string().min(1)).min(1),
    serviceIds: z.array(z.string().min(1)).min(1),
    email: z.string().email(),
    password: z.string().min(8).optional(),
    phone: z.string().min(8),
    whatsapp: z.string().optional(),
    description: z.string().min(20),
    yearsOfExperience: z.coerce.number().min(0).optional(),
    languages: z.array(z.string()).optional(),
    businessHours: z.array(businessHoursSchema).optional(),
    province: z.string().min(1),
    district: z.string().min(1),
    sector: z.string().optional(),
    address: z.string().optional(),
    displayName: z.string().min(2),
    tin: z.string().optional(),
    nationalId: z.string().optional(),
    logo: fileInfoSchema,
    documents: z.array(
      z.object({
        label: z.string().min(1),
        file: fileInfoSchema,
      })
    ).optional(),
    gallery: z.array(fileInfoSchema).optional(),
    portfolioImages: z.array(fileInfoSchema).optional(),
    certificates: z.array(fileInfoSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.providerType === 'COMPANY' && !data.tin?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TIN is required for company service providers',
        path: ['tin'],
      });
    }
    if (data.providerType === 'INDIVIDUAL' && !data.nationalId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'National ID is required for individual service providers',
        path: ['nationalId'],
      });
    }
  });

export const updateProviderStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED']),
  rejectionReason: z.string().optional(),
});

export const updateProviderRatingSchema = z.object({
  averageRating: z.coerce.number().min(0).max(5),
});

export const createCategorySchema = z.object({
  name: z.string().min(2),
  nameRw: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export const createServiceSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2),
  nameRw: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

export const updateServiceSchema = createServiceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

export const providerSearchQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  serviceId: z.string().optional(),
  serviceSlug: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  providerType: z.enum(PROVIDER_TYPES).optional(),
  sort: z.enum(['newest', 'alphabetical', 'rating', 'closest']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export const createServiceRequestSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerWhatsapp: z.string().min(8),
  customerEmail: z.string().email().optional().or(z.literal('')),
  preferredContactMethod: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']),
  preferredDate: z.string().optional(),
  province: z.string().min(1),
  district: z.string().min(1),
  sector: z.string().min(1),
  cell: z.string().min(1),
  village: z.string().min(1),
  address: z.string().min(3),
  description: z.string().min(10),
  attachments: z.array(fileInfoSchema).optional(),
});

export const updateServiceRequestStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]),
  note: z.string().optional(),
});

export const changeProviderPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

export const adminServiceRequestQuerySchema = z.object({
  status: z.string().optional(),
  providerId: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
