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
  updateProfileImage,
  deleteProfileImage,
  updateDocuments,
  deleteDocument,
  resetPassword,
  checkJobApplication,
  deactivateEmployeeAccount,
  activateEmployeeAccount,
  deleteEmployeeAccount,
} from '../controllers/employee.controller';
import { authenticateToken, authorizeRoles, ensureEmployeeActive } from '../middlewares/authMiddleware';
import uploadSingle, {uploadMultiple} from 'rod-fileupload';
import cloudinary from '../config/cloudinary';


const router = Router();

router.use(authenticateToken); // All employee routes require authentication
router.use(authorizeRoles(['employee'])); // All employee routes require employee role


router.get('/profile', getProfile);
router.patch('/profile', ensureEmployeeActive(), updateEmployeeProfile);
router.post('/upload/image', ensureEmployeeActive(), uploadSingle('image', cloudinary), uploadProfileImage);
router.post('/upload/documents', ensureEmployeeActive(), uploadMultiple('documents', cloudinary), uploadEmployeeDocuments);

// New file management routes
router.patch('/update/image', ensureEmployeeActive(), uploadSingle('image', cloudinary), updateProfileImage);
router.patch('/update/documents', ensureEmployeeActive(), uploadMultiple('documents', cloudinary), updateDocuments);
router.delete('/delete/image', ensureEmployeeActive(), deleteProfileImage);
router.delete('/delete/document/:index', ensureEmployeeActive(), deleteDocument);

// Password reset route
router.patch('/reset-password', resetPassword);


router.get('/jobs', getJobsByCategory);


router.get('/suggestions', getJobSuggestions);

router.post('/apply/:jobId', ensureEmployeeActive(), applyForJob);

router.get('/check-application/:jobId', checkJobApplication);


router.get('/applications', getApplications);

router.get('/notifications', getNotifications);
router.patch('/notifications/:notificationId/read', markNotificationRead);
router.delete('/notifications/:notificationId', deleteEmployeeNotification);

// Account lifecycle
router.patch('/deactivate', deactivateEmployeeAccount);
router.patch('/activate', activateEmployeeAccount);
router.delete('/delete', deleteEmployeeAccount);

// Work requests
router.get('/work-requests', listWorkRequests);
router.patch('/work-requests/:id/respond', respondWorkRequest);

export default router;
