import { Router } from 'express';
import {
  createHousekeeper,
  getAllHousekeepers,
  getHousekeeperById,
  updateHousekeeper,
  deleteHousekeeper,
  updateHousekeeperStatus,
  uploadHousekeeperImages,
  searchHousekeepers
} from '../controllers/housekeeper.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import uploadSingle, { uploadMultiple } from 'rod-fileupload';
import cloudinary from '../config/cloudinary';

const router = Router();

// Public routes (no authentication required)
router.post('/', uploadMultiple('images', cloudinary), createHousekeeper);
router.get('/search', searchHousekeepers);

// Protected routes (authentication required)
router.use(authenticateToken);

// Admin routes
router.get('/', authorizeRoles(['superadmin']), getAllHousekeepers);
router.get('/:id', authorizeRoles(['superadmin', 'housekeeper']), getHousekeeperById);
router.put('/:id', authorizeRoles(['superadmin', 'housekeeper']), uploadMultiple('images', cloudinary), updateHousekeeper);
router.delete('/:id', authorizeRoles(['superadmin']), deleteHousekeeper);
router.patch('/:id/status', authorizeRoles(['superadmin']), updateHousekeeperStatus);

// Housekeeper-specific routes
router.post('/:id/upload-images', authorizeRoles(['superadmin', 'housekeeper']), uploadMultiple('images', cloudinary), uploadHousekeeperImages);

export default router;