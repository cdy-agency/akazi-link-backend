import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  completeCompanyProfile,
  postJob,
  getCompanyJobs,
  getApplicantsForJob,
  updateApplicationStatus,
  uploadLogo,
  uploadDocuments,
  updateLogo,
  updateDocuments,
  deleteLogo,
  deleteDocument,
  browseEmployees,
  sendWorkRequest,
  getCompanyNotifications,
  markCompanyNotificationRead,
  deleteCompanyNotification,
  updateJob,
  toggleJobStatus,
  deleteJob,
  deactivateCompanyAccount,
  activateCompanyAccount,
  deleteCompanyAccount,
  getCompanyJobById,
} from '../controllers/company.controller';
import { authenticateToken, authorizeRoles, authorizeCompany } from '../middlewares/authMiddleware';
import uploadSingle, { uploadMultiple } from "rod-fileupload"
import cloudinary from '../config/cloudinary';

const router = Router();

router.use(authenticateToken); // All company routes require authentication

router.get('/profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), getProfile);


// Allow unapproved but active companies to update basics/password (not jobs)
router.patch('/profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), updateProfile);

// Allow unapproved but active companies to complete profile and upload files
router.patch('/complete-profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), completeCompanyProfile);

// Posting jobs still requires approval
router.post('/job', authorizeCompany({ requireApproval: true }), uploadSingle('image', cloudinary), postJob);
// Update existing job
router.patch('/job/:id', authorizeCompany({ requireApproval: true }), uploadSingle('image', cloudinary), updateJob);
// Toggle job active status
router.patch('/job/:id/status', authorizeCompany({ requireApproval: true }), toggleJobStatus);
// Delete existing job
router.delete('/job/:id', authorizeCompany({ requireApproval: true }), deleteJob);


router.get('/jobs', authorizeCompany({ requireApproval: true }), getCompanyJobs);
// Get a single job owned by the company
router.get('/job/:id', authorizeCompany({ requireApproval: true }), getCompanyJobById);


router.get('/applicants/:jobId', authorizeCompany({ requireApproval: true }), getApplicantsForJob);

// Update application status
router.patch('/applications/:applicationId/status', authorizeCompany({ requireApproval: true }), updateApplicationStatus);

// Browse employees and send work requests
router.get('/employees', authorizeCompany({ requireApproval: true }), browseEmployees);
router.post('/work-requests', authorizeCompany({ requireApproval: true }), sendWorkRequest);

// File upload endpoints
router.post('/upload/logo', authorizeCompany({ requireApproval: false, allowDisabled: true }), uploadSingle('logo', cloudinary), uploadLogo);
router.post('/upload/documents', authorizeCompany({ requireApproval: false, allowDisabled: true }), uploadMultiple('documents', cloudinary), uploadDocuments);
router.patch('/update/logo', authorizeCompany({ requireApproval: false, allowDisabled: true }), uploadSingle('logo', cloudinary), updateLogo);
router.patch('/update/documents', authorizeCompany({ requireApproval: false, allowDisabled: true }), uploadMultiple('documents', cloudinary), updateDocuments);
router.delete('/delete/logo', authorizeCompany({ requireApproval: false, allowDisabled: true }), deleteLogo);
router.delete('/delete/document/:index', authorizeCompany({ requireApproval: false, allowDisabled: true }), deleteDocument);

// Company notifications
router.get('/notifications', authorizeCompany({ requireApproval: false }), getCompanyNotifications);
router.patch('/notifications/:notificationId/read', authorizeCompany({ requireApproval: false }), markCompanyNotificationRead);
router.delete('/notifications/:notificationId', authorizeCompany({ requireApproval: false }), deleteCompanyNotification);

// Company account lifecycle
router.patch('/deactivate', authorizeCompany({ requireApproval: false, allowDisabled: true }), deactivateCompanyAccount);
router.patch('/activate', authorizeCompany({ requireApproval: false, allowDisabled: true }), activateCompanyAccount);
router.delete('/delete', authorizeCompany({ requireApproval: false, allowDisabled: true }), deleteCompanyAccount);

export default router;
