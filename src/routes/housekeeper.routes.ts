// LEGACY MODULE - SCHEDULED FOR DEPRECATION
// Domestic Work / Housekeepers — superadmin-only until Phase 10 removal.

import { Router } from 'express';
import {
  createHousekeeper,
  getAllHousekeepers,
  getHousekeeperById,
  updateHousekeeper,
  deleteHousekeeper,
  updateHousekeeperStatus,
  searchHousekeepersByLocation,
  uploadHousekeeperImage
} from '../controllers/housekeeper.controller';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

const superadminOnly = [
  authenticateToken,
  authorizeRoles(['superadmin']),
];

// LEGACY MODULE - SCHEDULED FOR DEPRECATION
router.post('/upload-image', ...superadminOnly, uploadSingle('image', cloudinary), uploadHousekeeperImage);

// LEGACY MODULE - SCHEDULED FOR DEPRECATION
router.post('/', ...superadminOnly, createHousekeeper);
router.get('/', ...superadminOnly, getAllHousekeepers);
router.get('/search', ...superadminOnly, searchHousekeepersByLocation);
router.get('/:id', ...superadminOnly, getHousekeeperById);
router.put('/:id', ...superadminOnly, updateHousekeeper);
router.delete('/:id', ...superadminOnly, deleteHousekeeper);

// LEGACY MODULE - SCHEDULED FOR DEPRECATION
router.put('/:id/status', ...superadminOnly, updateHousekeeperStatus);

export default router;
