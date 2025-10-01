import { Router } from 'express';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import {
  registerEmployer,
  listEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  getEmployerMatches,
  selectHousekeepers,
} from '../controllers/employer.controller';

const router = Router();

// Registration with optional profileImage upload handled by rod-fileupload
router.post('/employers', uploadSingle('profileImage', cloudinary), registerEmployer);

// CRUD
router.get('/employers', listEmployers);
router.get('/employers/:id', getEmployerById);
router.put('/employers/:id', uploadSingle('profileImage', cloudinary), updateEmployer);
router.delete('/employers/:id', deleteEmployer);

// Matching and selection
router.get('/employers/:id/matches', getEmployerMatches);
router.post('/employers/:id/select', selectHousekeepers);

export default router;

