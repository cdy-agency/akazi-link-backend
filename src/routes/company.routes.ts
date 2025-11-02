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
  getAllWorkRequests,
  deleteWorkRequest,
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
  getMatchedEmployeesForJob,
} from '../controllers/company.controller';
import { authenticateToken, authorizeRoles, authorizeCompany } from '../middlewares/authMiddleware';
import uploadSingle, { uploadMultiple } from "rod-fileupload"
import { optionalUploadSingle } from '../middlewares/optionalUpload'
import cloudinary from '../config/cloudinary';

const router = Router();

router.use(authenticateToken); // All company routes require authentication

router.get('/profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), getProfile);


// Allow unapproved but active companies to update basics/password (not jobs)
router.patch('/profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), updateProfile);

// Allow unapproved but active companies to complete profile and upload files
router.patch('/complete-profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), completeCompanyProfile);

// Posting jobs still requires approval
router.post('/job', authorizeCompany({ requireApproval: true }),postJob);
// Update existing job (image optional)
router.patch('/job/:id', authorizeCompany({ requireApproval: true }), optionalUploadSingle('image'), updateJob);
// Update existing job without file upload middleware (pure JSON/body)
router.patch('/job/:id/basic', authorizeCompany({ requireApproval: true }), updateJob);
// Toggle job active status
router.patch('/job/:id/status', authorizeCompany({ requireApproval: true }), toggleJobStatus);
// Delete existing job
router.delete('/job/:id', authorizeCompany({ requireApproval: true }), deleteJob);


router.get('/jobs', authorizeCompany({ requireApproval: true }), getCompanyJobs);
// Get a single job owned by the company
router.get('/job/:id', authorizeCompany({ requireApproval: true }), getCompanyJobById);
// Get matched employees for a job
router.get('/job/:jobId/matched-employees', authorizeCompany({ requireApproval: true }), getMatchedEmployeesForJob);


router.get('/applicants/:jobId', authorizeCompany({ requireApproval: true }), getApplicantsForJob);

// Update application status
router.patch('/applications/:applicationId/status', authorizeCompany({ requireApproval: true }), updateApplicationStatus);

// Browse employees and send work requests
router.get('/employees', authorizeCompany({ requireApproval: true }), browseEmployees);
router.post('/work-requests', authorizeCompany({ requireApproval: true }), sendWorkRequest);
router.get('/work-requests', authorizeCompany({requireApproval: true}), getAllWorkRequests)
router.delete('/work-requests/:id', authorizeCompany({requireApproval: true}), deleteWorkRequest)

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
