import { Router } from 'express';
import {
  getProfile,
  getJobsByCategory,
  getJobSuggestions,
  applyForJob,
  getRecommendedJobs,
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
import {
  uploadCv,
  getCv,
  replaceCv,
  deleteCv,
  downloadCv,
  retryCvProcessing,
} from '../controllers/cv.controller';
import { getEmployeeInterviews } from '../controllers/employee-interviews.controller';
import {
  getEmployeeOffers,
  respondEmployeeOffer,
} from '../controllers/employee-offers.controller';
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

// CV management
router.post('/cv', ensureEmployeeActive(), uploadSingle('cv', cloudinary), uploadCv);
router.get('/cv', getCv);
router.put('/cv', ensureEmployeeActive(), uploadSingle('cv', cloudinary), replaceCv);
router.delete('/cv', ensureEmployeeActive(), deleteCv);
router.post('/cv/retry-processing', ensureEmployeeActive(), retryCvProcessing);
router.get('/cv/download', downloadCv);

// Password reset route
router.patch('/reset-password', resetPassword);


router.get('/jobs', getJobsByCategory);


router.get('/suggestions', getJobSuggestions);

router.get('/recommended-jobs', getRecommendedJobs);

router.get('/interviews', getEmployeeInterviews);
router.get('/offers', getEmployeeOffers);
router.patch('/offers/:id/respond', ensureEmployeeActive(), respondEmployeeOffer);

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

export default router;
