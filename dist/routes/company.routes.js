"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rod_fileupload_1 = __importStar(require("rod-fileupload"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken); // All company routes require authentication
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
router.get('/profile', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), company_controller_1.getProfile);
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
router.patch('/profile', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), company_controller_1.updateProfile);
// Company completes missing information (about, documents)
// Allow unapproved but active companies to complete profile and upload files
router.patch('/complete-profile', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), company_controller_1.completeCompanyProfile);
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
router.post('/job', (0, authMiddleware_1.authorizeCompany)({ requireApproval: true }), (0, rod_fileupload_1.default)('image', cloudinary_1.default), company_controller_1.postJob);
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
router.get('/jobs', (0, authMiddleware_1.authorizeCompany)({ requireApproval: true }), company_controller_1.getCompanyJobs);
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
router.get('/applicants/:jobId', (0, authMiddleware_1.authorizeCompany)({ requireApproval: true }), company_controller_1.getApplicantsForJob);
// Update application status
router.patch('/applications/:applicationId/status', (0, authMiddleware_1.authorizeCompany)({ requireApproval: true }), company_controller_1.updateApplicationStatus);
// Browse employees and send work requests
const company_controller_2 = require("../controllers/company.controller");
router.get('/employees', (0, authMiddleware_1.authorizeCompany)({ requireApproval: true }), company_controller_2.browseEmployees);
router.post('/work-requests', (0, authMiddleware_1.authorizeCompany)({ requireApproval: true }), company_controller_2.sendWorkRequest);
// File upload endpoints
router.post('/upload/logo', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), (0, rod_fileupload_1.default)('logo', cloudinary_1.default), company_controller_1.uploadLogo);
router.post('/upload/documents', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), (0, rod_fileupload_1.uploadMultiple)('documents', cloudinary_1.default), company_controller_1.uploadDocuments);
router.patch('/update/logo', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), (0, rod_fileupload_1.default)('logo', cloudinary_1.default), company_controller_1.updateLogo);
router.patch('/update/documents', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), (0, rod_fileupload_1.uploadMultiple)('documents', cloudinary_1.default), company_controller_1.updateDocuments);
router.delete('/delete/logo', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), company_controller_1.deleteLogo);
router.delete('/delete/document/:index', (0, authMiddleware_1.authorizeCompany)({ requireApproval: false }), company_controller_1.deleteDocument);
exports.default = router;
