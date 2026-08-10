import { Router } from 'express';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import {
  listPublicJobs,
  listPublicUsers,
  getPublicJobById,
  getPublicUserById,
} from '../controllers/public.controller';
import { listPublicAds, getPublicAdById, recordPublicAdView } from '../controllers/public-advertisement.controller';
import {
  createAdvertisementRequest,
  uploadAdvertisementRequestMedia,
} from '../controllers/advertisement-request.controller';

const router = Router();

router.get('/advertisements', listPublicAds);
router.get('/advertisements/:id', getPublicAdById);
router.post('/advertisements/:id/views', recordPublicAdView);
router.post(
  '/advertisement-requests/upload',
  uploadSingle('media', cloudinary),
  uploadAdvertisementRequestMedia
);
router.post('/advertisement-requests', createAdvertisementRequest);

router.get('/jobs', listPublicJobs);

router.get('/jobs/:id', getPublicJobById);

router.get('/users', listPublicUsers);
router.get('/users/:id', getPublicUserById);

router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
