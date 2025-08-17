import { Router } from 'express';
import {
getProfile,
getJobsByCategory,
getJobSuggestions,
applyForJob,
getApplications,
getNotifications,
  updateEmployeeProfile,
  listWorkRequests,
  respondWorkRequest,
} from '../controllers/employee.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import {uploadMultiple} from 'rod-fileupload';
import cloudinary from '../config/cloudinary';
import { uploadDocuments } from '../controllers/company.controller';

const router = Router();

router.use(authenticateToken); // All employee routes require authentication
router.use(authorizeRoles(['employee'])); // All employee routes require employee role


router.get('/profile', getProfile);
router.patch('/profile', uploadMultiple('image', cloudinary),updateEmployeeProfile);
router.post('/upload/documents',uploadMultiple('documents', cloudinary), uploadDocuments);


router.get('/jobs', getJobsByCategory);


router.get('/suggestions', getJobSuggestions);

router.post('/apply/:jobId', applyForJob);


router.get('/applications', getApplications);

router.get('/notifications', getNotifications);

// Work requests
router.get('/work-requests', listWorkRequests);
router.patch('/work-requests/:id/respond', respondWorkRequest);

export default router;
