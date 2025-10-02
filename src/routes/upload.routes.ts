import { Router } from 'express';
import {
  uploadFile,
  uploadMultipleFiles,
  uploadProfileImage,
  uploadPassportImage,
  uploadFullBodyImage
} from '../controllers/upload.controller';

const router = Router();

// Upload routes
router.post('/', uploadFile);
router.post('/multiple', uploadMultipleFiles);
router.post('/profile-image', uploadProfileImage);
router.post('/passport-image', uploadPassportImage);
router.post('/full-body-image', uploadFullBodyImage);

export default router;

