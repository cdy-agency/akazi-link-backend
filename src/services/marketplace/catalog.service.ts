import ServiceCategory from '../../models/ServiceCategory';
import Service from '../../models/Service';
import ServiceProvider from '../../models/ServiceProvider';
import ProviderCategory from '../../models/ProviderCategory';
import ProviderService from '../../models/ProviderService';
import ProviderDocument from '../../models/ProviderDocument';
import ProviderNotification from '../../models/ProviderNotification';
import ServiceRequest from '../../models/ServiceRequest';
import { slugify } from '../../utils/slugify';
import { emailService } from '../email/email.service';
import { EmailTemplate } from '../email/email.types';
import { createProviderNotification } from './marketplace-notification.service';

export async function listActiveCategories() {
  return ServiceCategory.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
}

export async function listAllCategories() {
  return ServiceCategory.find()
    .sort({ sortOrder: 1, name: 1 })
    .lean();
}

export async function listAdminCatalog(filters: {
  q?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(50, Math.max(1, filters.limit || 10));
  const q = filters.q?.trim();
  const status = filters.status || 'all';

  const categoryQuery: Record<string, unknown> = {};

  if (status === 'active') categoryQuery.isActive = { $ne: false };
  if (status === 'inactive') categoryQuery.isActive = false;

  if (q) {
    const escape = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escape, 'i');

    const matchingServiceCategoryIds = await Service.find({
      $or: [
        { name: regex },
        { nameRw: regex },
        { description: regex },
      ],
    })
      .distinct('categoryId');

    categoryQuery.$or = [
      { name: regex },
      { nameRw: regex },
      { description: regex },
      ...(matchingServiceCategoryIds.length
        ? [{ _id: { $in: matchingServiceCategoryIds } }]
        : []),
    ];
  }

  const [categories, total] = await Promise.all([
    ServiceCategory.find(categoryQuery)
      .sort({ sortOrder: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ServiceCategory.countDocuments(categoryQuery),
  ]);

  const categoryIds = categories.map((c) => c._id);
  const services = categoryIds.length
    ? await Service.find({ categoryId: { $in: categoryIds } })
        .sort({ sortOrder: 1, name: 1 })
        .lean()
    : [];

  const servicesByCategory = new Map<string, typeof services>();
  for (const service of services) {
    const key = String(service.categoryId);
    const list = servicesByCategory.get(key) || [];
    list.push(service);
    servicesByCategory.set(key, list);
  }

  const items = categories.map((category) => ({
    ...category,
    services: servicesByCategory.get(String(category._id)) || [],
  }));

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function listServicesByCategory(categoryId?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (categoryId) filter.categoryId = categoryId;
  return Service.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function listAllServices(categoryId?: string) {
  const filter: Record<string, unknown> = {};
  if (categoryId) filter.categoryId = categoryId;
  return Service.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .populate('categoryId', 'name slug')
    .lean();
}

export async function listProvidersForAdmin(filters: {
  status?: string;
  needsReview?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const query: Record<string, unknown> = {};

  if (filters.needsReview) {
    query.status = { $in: ['PENDING', 'UNDER_REVIEW'] };
  } else if (filters.status) {
    query.status = filters.status;
  }

  const [items, total] = await Promise.all([
    ServiceProvider.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ServiceProvider.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getProviderAdminDetail(providerId: string) {
  const provider = await ServiceProvider.findById(providerId).select('-password').lean();
  if (!provider) return null;

  const [categories, services, documents] = await Promise.all([
    ProviderCategory.find({ providerId }).populate('categoryId').lean(),
    ProviderService.find({ providerId }).populate('serviceId').lean(),
    ProviderDocument.find({ providerId }).lean(),
  ]);

  return { provider, categories, services, documents };
}

export async function updateProviderStatus(
  providerId: string,
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED',
  adminId: string,
  rejectionReason?: string
) {
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw Object.assign(new Error('Service provider not found'), { statusCode: 404 });
  }

  provider.status = status;
  if (status === 'APPROVED') {
    provider.approvedAt = new Date();
    provider.approvedBy = adminId as any;
    provider.rejectionReason = undefined;
    provider.isActive = true;
  }

  if (status === 'REJECTED') {
    provider.rejectionReason = rejectionReason || 'Application rejected';
    provider.isActive = false;
  }

  if (status === 'SUSPENDED') {
    provider.isActive = false;
  }

  await provider.save();

  const dashboardUrl = `${process.env.FRONTEND_URL_DASHBOARD || process.env.APP_URL || ''}/dashboard/provider`;
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || '';
  const loginUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/login` : '';

  if (status === 'APPROVED') {
    await emailService.send({
      to: provider.email,
      template: EmailTemplate.PROVIDER_REGISTRATION_APPROVED,
      data: {
        name: provider.displayName,
        email: provider.email,
        dashboardUrl,
        loginUrl,
      },
    });

    await createProviderNotification({
      providerId: String(provider._id),
      type: 'PROVIDER_REGISTRATION_APPROVED',
      title: 'Application approved',
      message: 'Your service provider application has been approved. You can access your dashboard.',
      metadata: { dashboardUrl },
    });
  }

  if (status === 'REJECTED') {
    await emailService.send({
      to: provider.email,
      template: EmailTemplate.PROVIDER_REGISTRATION_REJECTED,
      data: {
        name: provider.displayName,
        reason: provider.rejectionReason,
      },
    });

    await createProviderNotification({
      providerId: String(provider._id),
      type: 'PROVIDER_REGISTRATION_REJECTED',
      title: 'Application rejected',
      message: provider.rejectionReason || 'Your service provider application was rejected.',
    });
  }

  return provider;
}

export async function updateProviderRating(
  providerId: string,
  averageRating: number
) {
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw Object.assign(new Error('Service provider not found'), { statusCode: 404 });
  }

  const rating = Math.round(Number(averageRating) * 2) / 2;
  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    throw Object.assign(new Error('Rating must be between 0 and 5'), {
      statusCode: 400,
    });
  }

  provider.averageRating = rating;
  // Rated when > 0 so public cards show the score; 0 clears rating / unrated
  provider.reviewCount = rating > 0 ? Math.max(provider.reviewCount || 0, 1) : 0;

  await provider.save();
  return provider;
}

export async function deleteProvider(providerId: string) {
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw Object.assign(new Error('Service provider not found'), { statusCode: 404 });
  }

  const requestCount = await ServiceRequest.countDocuments({ providerId });
  if (requestCount > 0) {
    throw Object.assign(
      new Error('Cannot delete a provider that has service requests. Suspend it instead.'),
      { statusCode: 400 }
    );
  }

  await Promise.all([
    ProviderCategory.deleteMany({ providerId }),
    ProviderService.deleteMany({ providerId }),
    ProviderDocument.deleteMany({ providerId }),
    ProviderNotification.deleteMany({ providerId }),
  ]);

  await provider.deleteOne();
}

export async function createCategory(input: {
  name: string;
  nameRw?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const slug = slugify(input.name);
  return ServiceCategory.create({
    slug,
    name: input.name,
    nameRw: input.nameRw,
    description: input.description,
    icon: input.icon,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function createService(input: {
  categoryId: string;
  name: string;
  nameRw?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const slug = slugify(input.name);
  return Service.create({
    categoryId: input.categoryId,
    slug,
    name: input.name,
    nameRw: input.nameRw,
    description: input.description,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    nameRw?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const category = await ServiceCategory.findById(id);
  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }

  if (input.name !== undefined) {
    category.name = input.name;
    category.slug = slugify(input.name);
  }
  if (input.nameRw !== undefined) category.nameRw = input.nameRw;
  if (input.description !== undefined) category.description = input.description;
  if (input.icon !== undefined) category.icon = input.icon;
  if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) category.isActive = input.isActive;

  await category.save();
  return category;
}

export async function deleteCategory(id: string) {
  const category = await ServiceCategory.findById(id);
  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }

  const providerLinks = await ProviderCategory.countDocuments({ categoryId: id });
  if (providerLinks > 0) {
    throw Object.assign(
      new Error('Cannot delete category linked to service providers'),
      { statusCode: 400 }
    );
  }

  await Service.deleteMany({ categoryId: id });
  await category.deleteOne();
}

export async function updateService(
  id: string,
  input: {
    categoryId?: string;
    name?: string;
    nameRw?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const service = await Service.findById(id);
  if (!service) {
    throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  }

  if (input.categoryId !== undefined) service.categoryId = input.categoryId as any;
  if (input.name !== undefined) {
    service.name = input.name;
    service.slug = slugify(input.name);
  }
  if (input.nameRw !== undefined) service.nameRw = input.nameRw;
  if (input.description !== undefined) service.description = input.description;
  if (input.sortOrder !== undefined) service.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) service.isActive = input.isActive;

  await service.save();
  return service;
}

export async function deleteService(id: string) {
  const service = await Service.findById(id);
  if (!service) {
    throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  }

  const providerLinks = await ProviderService.countDocuments({ serviceId: id });
  if (providerLinks > 0) {
    throw Object.assign(
      new Error('Cannot delete service linked to service providers'),
      { statusCode: 400 }
    );
  }

  await service.deleteOne();
}
