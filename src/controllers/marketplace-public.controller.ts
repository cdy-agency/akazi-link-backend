import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { registerServiceProvider } from '../services/marketplace/provider-registration.service';
import {
  getCategoryBySlug,
  getPublicProviderBySlug,
  getServiceBySlug,
  listCategoriesWithProviderCounts,
  listServicesWithProviderCounts,
  searchPublicProviders,
} from '../services/marketplace/provider-search.service';
import { createServiceRequest } from '../services/marketplace/service-request.service';
import {
  createServiceRequestSchema,
  providerRegistrationSchema,
  providerSearchQuerySchema,
} from '../validators/marketplace.validator';
import { parseMultipleFiles, parseSingleFile } from '../services/fileUploadService';
import {
  UPLOAD_LIMITS,
  assertUploadedFileSize,
  assertUploadedFilesSize,
  respondUploadError,
} from '../utils/upload-limits';

function validationError(res: Response, error: ZodError) {
  const issue = error.issues[0];
  const path = issue?.path?.length ? issue.path.join('.') : null;
  const message = path
    ? `${path}: ${issue.message}`
    : issue?.message || 'Validation failed';
  return res.status(400).json({ message });
}

export const getMarketplaceCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await listCategoriesWithProviderCounts();
    res.status(200).json({ categories });
  } catch (error) {
    console.error('getMarketplaceCategories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMarketplaceCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const data = await getCategoryBySlug(req.params.slug);
    res.status(200).json(data);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const getMarketplaceServices = async (req: Request, res: Response) => {
  try {
    const { categoryId, q } = req.query;
    const services = await listServicesWithProviderCounts(
      typeof categoryId === 'string' ? categoryId : undefined,
      typeof q === 'string' ? q : undefined
    );
    res.status(200).json({ services });
  } catch (error) {
    console.error('getMarketplaceServices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchMarketplaceProviders = async (req: Request, res: Response) => {
  try {
    const parsed = providerSearchQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error);
    const result = await searchPublicProviders(parsed.data);
    res.status(200).json(result);
  } catch (error) {
    console.error('searchMarketplaceProviders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMarketplaceProviderBySlug = async (req: Request, res: Response) => {
  try {
    const data = await getPublicProviderBySlug(req.params.slug);
    res.status(200).json(data);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const getMarketplaceServiceContext = async (req: Request, res: Response) => {
  try {
    const data = await getServiceBySlug(req.params.categorySlug, req.params.serviceSlug);
    res.status(200).json(data);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const createMarketplaceServiceRequest = async (req: Request, res: Response) => {
  try {
    const parsed = createServiceRequestSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const customerId = req.user?.id;
    const request = await createServiceRequest(parsed.data, customerId);

    res.status(201).json({
      message: 'Service request submitted successfully',
      request,
    });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    if (status !== 500) {
      return res.status(status).json({ message: error.message });
    }
    console.error('createMarketplaceServiceRequest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerMarketplaceProvider = async (req: Request, res: Response) => {
  try {
    const parsed = providerRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationError(res, parsed.error);
    }

    const provider = await registerServiceProvider(parsed.data);

    res.status(201).json({
      message: 'Service provider registration submitted successfully',
      provider: {
        id: provider._id,
        displayName: provider.displayName,
        email: provider.email,
        status: provider.status,
        providerType: provider.providerType,
      },
    });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    if (status !== 500) {
      return res.status(status).json({ message: error.message });
    }
    console.error('registerMarketplaceProvider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadMarketplaceLogo = async (req: Request, res: Response) => {
  try {
    const logo = parseSingleFile((req.body as any).logo);
    if (!logo) {
      return res.status(400).json({ message: 'Logo is required' });
    }
    assertUploadedFileSize(logo, UPLOAD_LIMITS.logo, 'Logo');
    res.status(200).json({ logo });
  } catch (error) {
    return respondUploadError(res, error, 'Server error during logo upload');
  }
};

export const uploadMarketplaceDocuments = async (req: Request, res: Response) => {
  try {
    const files = parseMultipleFiles((req.body as any).documents);
    if (!files.length) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }
    assertUploadedFilesSize(files, UPLOAD_LIMITS.document, 'Document');
    res.status(200).json({ files });
  } catch (error) {
    return respondUploadError(res, error, 'Server error during documents upload');
  }
};

export const uploadMarketplaceRequestAttachments = async (req: Request, res: Response) => {
  try {
    const files = parseMultipleFiles((req.body as any).attachments);
    if (!files.length) {
      return res.status(400).json({ message: 'No attachments uploaded' });
    }
    assertUploadedFilesSize(files, UPLOAD_LIMITS.document, 'Attachment');
    res.status(200).json({ files });
  } catch (error) {
    return respondUploadError(res, error, 'Server error during attachment upload');
  }
};
