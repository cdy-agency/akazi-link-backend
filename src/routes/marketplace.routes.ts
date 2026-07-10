import { Router } from 'express';
import uploadSingle, { uploadMultiple } from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import { optionalAuthenticateToken } from '../middlewares/authMiddleware';
import {
  createMarketplaceServiceRequest,
  getMarketplaceCategories,
  getMarketplaceCategoryBySlug,
  getMarketplaceProviderBySlug,
  getMarketplaceServiceContext,
  getMarketplaceServices,
  registerMarketplaceProvider,
  searchMarketplaceProviders,
  uploadMarketplaceDocuments,
  uploadMarketplaceLogo,
  uploadMarketplaceRequestAttachments,
} from '../controllers/marketplace-public.controller';

const router = Router();

router.get('/categories', getMarketplaceCategories);
router.get('/categories/:slug', getMarketplaceCategoryBySlug);
router.get('/services', getMarketplaceServices);
router.get('/providers', searchMarketplaceProviders);
router.get('/providers/:slug', getMarketplaceProviderBySlug);
router.get('/browse/:categorySlug/:serviceSlug', getMarketplaceServiceContext);
router.post('/service-requests', optionalAuthenticateToken, createMarketplaceServiceRequest);
router.post('/uploads/logo', uploadSingle('logo', cloudinary), uploadMarketplaceLogo);
router.post(
  '/uploads/documents',
  uploadMultiple('documents', cloudinary),
  uploadMarketplaceDocuments
);
router.post(
  '/uploads/request-attachments',
  uploadMultiple('attachments', cloudinary),
  uploadMarketplaceRequestAttachments
);
router.post('/providers/register', registerMarketplaceProvider);

export default router;
