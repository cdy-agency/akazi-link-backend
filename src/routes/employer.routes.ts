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
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';

const router = Router();

// Public routes (no authentication required)
router.post('/', uploadSingle('profileImage', cloudinary), createEmployer);

// Protected routes (authentication required)
router.use(authenticateToken);

// Admin routes
router.get('/', authorizeRoles(['superadmin']), getAllEmployers);
router.get('/:id', authorizeRoles(['superadmin', 'employer']), getEmployerById);
router.put('/:id', authorizeRoles(['superadmin', 'employer']), uploadSingle('profileImage', cloudinary), updateEmployer);
router.delete('/:id', authorizeRoles(['superadmin']), deleteEmployer);
router.patch('/:id/status', authorizeRoles(['superadmin']), updateEmployerStatus);

// Employer-specific routes
router.get('/:id/matches', authorizeRoles(['superadmin', 'employer']), getMatchingHousekeepers);
router.post('/:id/select', authorizeRoles(['superadmin', 'employer']), selectHousekeepers);

export default router;