// LEGACY MODULE - SCHEDULED FOR DEPRECATION
// Domestic Work / Employers — superadmin-only until Phase 10 removal.

import { Router } from 'express';
import {
  createEmployer,
  getAllEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  getMatchingHousekeepers,
  selectHousekeepers,
  updateEmployerStatus
} from '../controllers/employer.controller';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

const superadminOnly = [
  authenticateToken,
  authorizeRoles(['superadmin']),
];

// LEGACY MODULE - SCHEDULED FOR DEPRECATION
router.post('/', ...superadminOnly, uploadSingle('profileImage', cloudinary), createEmployer);
router.get('/', ...superadminOnly, getAllEmployers);
router.get('/:id', ...superadminOnly, getEmployerById);
router.put('/:id', ...superadminOnly, updateEmployer);
router.delete('/:id', ...superadminOnly, deleteEmployer);

// LEGACY MODULE - SCHEDULED FOR DEPRECATION
router.get('/:id/matches', ...superadminOnly, getMatchingHousekeepers);
router.post('/:id/select', ...superadminOnly, selectHousekeepers);
router.put('/:id/status', ...superadminOnly, updateEmployerStatus);

export default router;
