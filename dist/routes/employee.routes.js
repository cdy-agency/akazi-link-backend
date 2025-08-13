"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken); // All employee routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['employee'])); // All employee routes require employee role
/**
 * @swagger
 * /api/employee/profile:
 *   get:
 *     summary: Get employee profile
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not an employee
 */
router.get('/profile', employee_controller_1.getProfile);
router.patch('/profile', employee_controller_1.updateEmployeeProfile);
/**
 * @swagger
 * /api/employee/jobs:
 *   get:
 *     summary: Get jobs by category
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Job category to filter by
 *         example: IT & Software
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not an employee
 */
router.get('/jobs', employee_controller_1.getJobsByCategory);
/**
 * @swagger
 * /api/employee/suggestions:
 *   get:
 *     summary: Get personalized job suggestions
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not an employee
 */
router.get('/suggestions', employee_controller_1.getJobSuggestions);
/**
 * @swagger
 * /api/employee/apply/{jobId}:
 *   post:
 *     summary: Apply for a job
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job to apply for
 *         example: 60d5ec49f8c7d00015f8e3b1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skills
 *               - experience
 *               - appliedVia
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["JavaScript", "React", "Node.js"]
 *               experience:
 *                 type: string
 *                 example: 5 years in web development
 *               appliedVia:
 *                 type: string
 *                 enum: [normal, whatsapp, referral]
 *                 example: normal
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Application submitted successfully
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *       400:
 *         description: Bad request - validation error or already applied
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not an employee
 *       404:
 *         description: Job not found
 */
router.post('/apply/:jobId', employee_controller_1.applyForJob);
/**
 * @swagger
 * /api/employee/applications:
 *   get:
 *     summary: Get employee's job applications
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not an employee
 */
router.get('/applications', employee_controller_1.getApplications);
/**
 * @swagger
 * /api/employee/notifications:
 *   get:
 *     summary: Get employee notifications
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Your application has been reviewed.
 *                   read:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not an employee
 */
router.get('/notifications', employee_controller_1.getNotifications);
// Work requests
router.get('/work-requests', employee_controller_1.listWorkRequests);
router.patch('/work-requests/:id/respond', employee_controller_1.respondWorkRequest);
exports.default = router;
