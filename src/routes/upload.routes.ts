import { Router } from 'express';
import {
  uploadFile,
  uploadMultipleFiles,
  uploadProfileImage,
  uploadPassportImage,
  uploadFullBodyImage
} from '../controllers/upload.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const authenticatedUploadRoles = [
  authenticateToken,
  authorizeRoles(['employee', 'company', 'superadmin']),
];

const superadminOnly = [
  authenticateToken,
  authorizeRoles(['superadmin']),
];

const router = Router();

router.post('/', ...authenticatedUploadRoles, uploadFile);
router.post('/multiple', ...authenticatedUploadRoles, uploadMultipleFiles);
router.post('/profile-image', ...authenticatedUploadRoles, uploadProfileImage);
router.post('/passport-image', ...superadminOnly, uploadPassportImage);
router.post('/full-body-image', ...superadminOnly, uploadFullBodyImage);

export default router;
