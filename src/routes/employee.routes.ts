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
  markNotificationRead,
  deleteEmployeeNotification,
  uploadEmployeeDocuments,
  uploadProfileImage,
} from '../controllers/employee.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import uploadSingle, {uploadMultiple} from 'rod-fileupload';
import cloudinary from '../config/cloudinary';


const router = Router();

router.use(authenticateToken); // All employee routes require authentication
router.use(authorizeRoles(['employee'])); // All employee routes require employee role


router.get('/profile', getProfile);
router.patch('/profile', updateEmployeeProfile);
router.post('/upload/image', uploadSingle('image', cloudinary), uploadProfileImage);
router.post('/upload/documents',uploadMultiple('documents', cloudinary), uploadEmployeeDocuments);


router.get('/jobs', getJobsByCategory);


router.get('/suggestions', getJobSuggestions);

router.post('/apply/:jobId', applyForJob);


router.get('/applications', getApplications);

router.get('/notifications', getNotifications);
router.patch('/notifications/:notificationId/read', markNotificationRead);
router.delete('/notifications/:notificationId', deleteEmployeeNotification);

// Work requests
router.get('/work-requests', listWorkRequests);
router.patch('/work-requests/:id/respond', respondWorkRequest);

export default router;
