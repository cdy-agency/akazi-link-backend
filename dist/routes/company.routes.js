"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rod_fileupload_1 = __importDefault(require("rod-fileupload"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken); // All company routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['company'])); // All company routes require company role and approval
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
router.get('/profile', company_controller_1.getProfile);
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
router.patch('/profile', company_controller_1.updateProfile);
// Company completes missing information (about, documents)
router.patch('/complete-profile', company_controller_1.completeCompanyProfile);
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
router.post('/job', (0, rod_fileupload_1.default)('image', cloudinary_1.default), company_controller_1.postJob);
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
router.get('/jobs', company_controller_1.getCompanyJobs);
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
router.get('/applicants/:jobId', company_controller_1.getApplicantsForJob);
// Update application status
router.patch('/applications/:applicationId/status', company_controller_1.updateApplicationStatus);
// Browse employees and send work requests
const company_controller_2 = require("../controllers/company.controller");
router.get('/employees', company_controller_2.browseEmployees);
router.post('/work-requests', company_controller_2.sendWorkRequest);
exports.default = router;
