import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  createCategorySchema,
  createServiceSchema,
  updateCategorySchema,
  updateProviderStatusSchema,
  updateServiceSchema,
} from '../validators/marketplace.validator';
import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  getProviderAdminDetail,
  listAllCategories,
  listAllServices,
  listProvidersForAdmin,
  updateCategory,
  updateProviderStatus,
  updateService,
} from '../services/marketplace/catalog.service';
import { getMarketplaceAdminMetrics } from '../services/marketplace/marketplace-admin-notification.service';
import {
  getServiceRequestById,
  listAdminServiceRequests,
  updateServiceRequestStatus,
} from '../services/marketplace/service-request.service';
import {
  adminServiceRequestQuerySchema,
  updateServiceRequestStatusSchema,
} from '../validators/marketplace.validator';

function validationError(res: Response, error: ZodError) {
  const message = error.issues[0]?.message || 'Validation failed';
  return res.status(400).json({ message });
}

export const getAdminMarketplaceOverview = async (_req: Request, res: Response) => {
  try {
    const metrics = await getMarketplaceAdminMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    console.error('getAdminMarketplaceOverview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listAdminMarketplaceCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await listAllCategories();
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const listAdminMarketplaceServices = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;
    const services = await listAllServices(
      typeof categoryId === 'string' ? categoryId : undefined
    );
    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdminMarketplaceCategory = async (req: Request, res: Response) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const category = await createCategory(parsed.data);
    res.status(201).json({ category });
  } catch (error) {
    console.error('createAdminMarketplaceCategory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdminMarketplaceService = async (req: Request, res: Response) => {
  try {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const service = await createService(parsed.data);
    res.status(201).json({ service });
  } catch (error) {
    console.error('createAdminMarketplaceService error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminMarketplaceCategory = async (req: Request, res: Response) => {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const category = await updateCategory(req.params.id, parsed.data);
    res.status(200).json({ category });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const deleteAdminMarketplaceCategory = async (req: Request, res: Response) => {
  try {
    await deleteCategory(req.params.id);
    res.status(200).json({ message: 'Category deleted' });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const updateAdminMarketplaceService = async (req: Request, res: Response) => {
  try {
    const parsed = updateServiceSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const service = await updateService(req.params.id, parsed.data);
    res.status(200).json({ service });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const deleteAdminMarketplaceService = async (req: Request, res: Response) => {
  try {
    await deleteService(req.params.id);
    res.status(200).json({ message: 'Service deleted' });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const listAdminMarketplaceProviders = async (req: Request, res: Response) => {
  try {
    const { status, page, limit, needsReview } = req.query;
    const result = await listProvidersForAdmin({
      status: typeof status === 'string' ? status : undefined,
      needsReview: needsReview === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('listAdminMarketplaceProviders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminMarketplaceProviderById = async (req: Request, res: Response) => {
  try {
    const detail = await getProviderAdminDetail(req.params.id);
    if (!detail) return res.status(404).json({ message: 'Service provider not found' });
    res.status(200).json(detail);
  } catch (error) {
    console.error('getAdminMarketplaceProviderById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminMarketplaceProviderStatus = async (req: Request, res: Response) => {
  try {
    const parsed = updateProviderStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const provider = await updateProviderStatus(
      req.params.id,
      parsed.data.status,
      req.user!.id,
      parsed.data.rejectionReason
    );

    res.status(200).json({
      message: 'Service provider status updated',
      provider,
    });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    if (status !== 500) {
      return res.status(status).json({ message: error.message });
    }
    console.error('updateAdminMarketplaceProviderStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listAdminServiceRequestsHandler = async (req: Request, res: Response) => {
  try {
    const parsed = adminServiceRequestQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error);
    const result = await listAdminServiceRequests(parsed.data);
    res.status(200).json(result);
  } catch (error) {
    console.error('listAdminServiceRequestsHandler error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminServiceRequestById = async (req: Request, res: Response) => {
  try {
    const request = await getServiceRequestById(req.params.id);
    res.status(200).json({ request });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const updateAdminServiceRequestStatus = async (req: Request, res: Response) => {
  try {
    const parsed = updateServiceRequestStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const request = await updateServiceRequestStatus(
      req.params.id,
      parsed.data.status,
      { id: req.user!.id, role: 'superadmin' },
      parsed.data.note
    );

    res.status(200).json({ request });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};
