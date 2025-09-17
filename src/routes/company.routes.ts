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

/**
 * @swagger
 * /api/company/profile:
 *   get:
 *     summary: Get company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a company or not approved
 */
// Allow unapproved but active companies to fetch profile
router.get('/profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), getProfile);

/**
 * @swagger
 * /api/company/profile:
 *   patch:
 *     summary: Update company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Acme Corp Updated
 *               location:
 *                 type: string
 *                 example: San Francisco, USA
 *               phoneNumber:
 *                 type: string
 *                 example: "+1987654321"
 *               website:
 *                 type: string
 *                 example: https://www.acmecorp.com
 *               logo:
 *                 type: string
 *                 example: https://www.acmecorp.com/logo.png
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a company or not approved
 */
// Allow unapproved but active companies to update basics/password (not jobs)
router.patch('/profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), updateProfile);
// Company completes missing information (about, documents)
// Allow unapproved but active companies to complete profile and upload files
router.patch('/complete-profile', authorizeCompany({ requireApproval: false, allowDisabled: true }), completeCompanyProfile);

/**
 * @swagger
 * /api/company/job:
 *   post:
 *     summary: Post a new job
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - skills
 *               - experience
 *               - employmentType
 *               - salary
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Senior Software Engineer
 *               description:
 *                 type: string
 *                 example: We are looking for a skilled software engineer to join our team...
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Node.js", "React", "MongoDB", "TypeScript"]
 *               experience:
 *                 type: string
 *                 example: 5+ years
 *               employmentType:
 *                 type: string
 *                 enum: [fulltime, part-time, internship]
 *                 example: fulltime
 *               salary:
 *                 type: string
 *                 example: $120,000 - $150,000
 *               category:
 *                 type: string
 *                 example: IT & Software
 *     responses:
 *       201:
 *         description: Job posted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job posted successfully
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a company or not approved
 */
// Posting jobs still requires approval
router.post('/job', authorizeCompany({ requireApproval: true }), uploadSingle('image', cloudinary), postJob);
// Update existing job
router.patch('/job/:id', authorizeCompany({ requireApproval: true }), uploadSingle('image', cloudinary), updateJob);
// Toggle job active status
router.patch('/job/:id/status', authorizeCompany({ requireApproval: true }), toggleJobStatus);
// Delete existing job
router.delete('/job/:id', authorizeCompany({ requireApproval: true }), deleteJob);

/**
 * @swagger
 * /api/company/jobs:
 *   get:
 *     summary: Get all jobs posted by the company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a company or not approved
 */
router.get('/jobs', authorizeCompany({ requireApproval: true }), getCompanyJobs);
// Get a single job owned by the company
router.get('/job/:id', authorizeCompany({ requireApproval: true }), getCompanyJobById);

/**
 * @swagger
 * /api/company/applicants/{jobId}:
 *   get:
 *     summary: Get all applicants for a specific job
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job to get applicants for
 *         example: 60d5ec49f8c7d00015f8e3b1
 *     responses:
 *       200:
 *         description: Applicants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a company or not approved, or job doesn't belong to company
 *       404:
 *         description: Job not found
 */
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
