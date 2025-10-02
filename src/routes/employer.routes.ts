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

const router = Router();

// Employer CRUD routes
router.post('/',uploadSingle('profileImage', cloudinary), createEmployer);
router.get('/', getAllEmployers);
router.get('/:id', getEmployerById);
router.put('/:id', updateEmployer);
router.delete('/:id', deleteEmployer);

// Employer specific routes
router.get('/:id/matches', getMatchingHousekeepers);
router.post('/:id/select', selectHousekeepers);
router.put('/:id/status', updateEmployerStatus);

export default router;

