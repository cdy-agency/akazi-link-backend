import ServiceCategory from '../../models/ServiceCategory';
import Service from '../../models/Service';
import ServiceProvider from '../../models/ServiceProvider';
import ProviderCategory from '../../models/ProviderCategory';
import ProviderService from '../../models/ProviderService';
import { PUBLIC_PROVIDER_STATUSES } from '../../config/marketplace.config';

const APPROVED_FILTER = {
  status: { $in: PUBLIC_PROVIDER_STATUSES },
  isActive: { $ne: false },
};

export async function listCategoriesWithProviderCounts() {
  const categories = await ServiceCategory.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const counts = await ProviderCategory.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'providerId',
        foreignField: '_id',
        as: 'provider',
      },
    },
    { $unwind: '$provider' },
    {
      $match: {
        'provider.status': { $in: PUBLIC_PROVIDER_STATUSES },
        'provider.isActive': { $ne: false },
      },
    },
    { $group: { _id: '$categoryId', providerCount: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((row) => [String(row._id), row.providerCount as number])
  );

  return categories.map((category) => ({
    ...category,
    providerCount: countMap.get(String(category._id)) || 0,
  }));
}

export async function listServicesWithProviderCounts(
  categoryId?: string,
  searchQuery?: string
) {
  const filter: Record<string, unknown> = { isActive: true };
  if (categoryId) filter.categoryId = categoryId;
  if (searchQuery?.trim()) {
    const regex = new RegExp(
      searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
    filter.$or = [{ name: regex }, { nameRw: regex }, { description: regex }];
  }

  const services = await Service.find(filter)
    .populate('categoryId', 'name nameRw slug')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const counts = await ProviderService.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'providerId',
        foreignField: '_id',
        as: 'provider',
      },
    },
    { $unwind: '$provider' },
    {
      $match: {
        'provider.status': { $in: PUBLIC_PROVIDER_STATUSES },
        'provider.isActive': { $ne: false },
      },
    },
    { $group: { _id: '$serviceId', providerCount: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((row) => [String(row._id), row.providerCount as number])
  );

  return services.map((service) => ({
    ...service,
    providerCount: countMap.get(String(service._id)) || 0,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const category = await ServiceCategory.findOne({ slug, isActive: true }).lean();
  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }

  const services = await Service.find({ categoryId: category._id, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const providerCount = await ProviderCategory.aggregate([
    { $match: { categoryId: category._id } },
    {
      $lookup: {
        from: 'users',
        localField: 'providerId',
        foreignField: '_id',
        as: 'provider',
      },
    },
    { $unwind: '$provider' },
    { $match: { 'provider.status': { $in: PUBLIC_PROVIDER_STATUSES } } },
    { $count: 'total' },
  ]);

  return {
    category,
    services,
    providerCount: providerCount[0]?.total || 0,
  };
}

export async function getServiceBySlug(categorySlug: string, serviceSlug: string) {
  const category = await ServiceCategory.findOne({ slug: categorySlug, isActive: true }).lean();
  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }

  const service = await Service.findOne({
    categoryId: category._id,
    slug: serviceSlug,
    isActive: true,
  }).lean();

  if (!service) {
    throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  }

  return { category, service };
}

async function resolveProviderIds(filters: {
  categoryId?: string;
  categorySlug?: string;
  serviceId?: string;
  serviceSlug?: string;
}): Promise<string[] | null> {
  let providerIds: string[] | null = null;

  if (filters.categorySlug) {
    const category = await ServiceCategory.findOne({
      slug: filters.categorySlug,
      isActive: true,
    }).lean();
    if (!category) return [];
    filters.categoryId = String(category._id);
  }

  if (filters.serviceSlug && filters.categoryId) {
    const service = await Service.findOne({
      categoryId: filters.categoryId,
      slug: filters.serviceSlug,
      isActive: true,
    }).lean();
    if (!service) return [];
    filters.serviceId = String(service._id);
  }

  if (filters.serviceId) {
    const links = await ProviderService.find({ serviceId: filters.serviceId }).lean();
    providerIds = links.map((link) => String(link.providerId));
    if (!providerIds.length) return [];
  } else if (filters.categoryId) {
    const links = await ProviderCategory.find({ categoryId: filters.categoryId }).lean();
    providerIds = links.map((link) => String(link.providerId));
    if (!providerIds.length) return [];
  }

  return providerIds;
}

function mapSort(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'alphabetical':
      return { displayName: 1 };
    case 'newest':
      return { createdAt: -1 };
    case 'closest':
    case 'rating':
    default:
      // Default / rating: higher rating first; unrated (0) fall back to newest
      return { averageRating: -1, createdAt: -1 };
  }
}

export async function searchPublicProviders(filters: {
  q?: string;
  categoryId?: string;
  categorySlug?: string;
  serviceId?: string;
  serviceSlug?: string;
  province?: string;
  district?: string;
  sector?: string;
  providerType?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 10, 50);
  const skip = (page - 1) * limit;

  const scopedIds = await resolveProviderIds(filters);
  if (scopedIds && !scopedIds.length) {
    return { items: [], total: 0, page, limit };
  }

  const query: Record<string, unknown> = { ...APPROVED_FILTER };

  if (scopedIds) {
    query._id = { $in: scopedIds };
  }

  if (filters.q?.trim()) {
    query.$text = { $search: filters.q.trim() };
  }
  if (filters.province) query.province = filters.province;
  if (filters.district) query.district = filters.district;
  if (filters.sector) query.sector = filters.sector;
  if (filters.providerType) query.providerType = filters.providerType;

  const [items, total] = await Promise.all([
    ServiceProvider.find(query)
      .select(
        'displayName slug providerType description province district sector yearsOfExperience averageRating reviewCount logo phone whatsapp email createdAt'
      )
      .sort(mapSort(filters.sort))
      .skip(skip)
      .limit(limit)
      .lean(),
    ServiceProvider.countDocuments(query),
  ]);

  const enriched = await Promise.all(
    items.map(async (provider) => {
      const serviceCount = await ProviderService.countDocuments({
        providerId: provider._id,
      });
      return { ...provider, serviceCount };
    })
  );

  return { items: enriched, total, page, limit };
}

export async function getPublicProviderBySlug(slug: string) {
  const provider = await ServiceProvider.findOne({
    slug,
    ...APPROVED_FILTER,
  })
    .select('-password -rejectionReason -approvedBy')
    .lean();

  if (!provider) {
    throw Object.assign(new Error('Provider not found'), { statusCode: 404 });
  }

  const [categoryLinks, serviceLinks] = await Promise.all([
    ProviderCategory.find({ providerId: provider._id })
      .populate('categoryId', 'name slug')
      .lean(),
    ProviderService.find({ providerId: provider._id })
      .populate('serviceId', 'name slug categoryId')
      .lean(),
  ]);

  const categories = categoryLinks
    .map((link: any) => link.categoryId)
    .filter(Boolean);
  const services = serviceLinks
    .map((link: any) => link.serviceId)
    .filter(Boolean);

  return {
    provider,
    categories,
    services,
    serviceCount: services.length,
  };
}
