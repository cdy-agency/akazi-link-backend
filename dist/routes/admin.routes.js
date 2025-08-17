"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rod_fileupload_1 = __importDefault(require("rod-fileupload"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@joblink.com
 *               password:
 *                 type: string
 *                 example: adminpassword123
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request - missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', admin_controller_1.adminLogin); // Admin login does not require prior authentication
router.use(authMiddleware_1.authenticateToken); // All subsequent admin routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['superadmin'])); // All subsequent admin routes require superadmin role
/**
 * @swagger
 * /api/admin/update-password:
 *   patch:
 *     summary: Update admin password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token or current password
 *       403:
 *         description: Forbidden - not a superadmin
 */
router.patch('/update-password', (0, rod_fileupload_1.default)('image', cloudinary_1.default), admin_controller_1.updateAdminPassword);
/**
 * @swagger
 * /api/admin/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a superadmin
 */
router.get('/employees', admin_controller_1.getEmployees);
/**
 * @swagger
 * /api/admin/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Companies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a superadmin
 */
router.get('/companies', admin_controller_1.getCompanies);
/**
 * @swagger
 * /api/admin/company/{id}/approve:
 *   patch:
 *     summary: Approve or reject a company
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the company to approve/reject
 *         example: 60d5ec49f8c7d00015f8e3b1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isApproved
 *             properties:
 *               isApproved:
 *                 type: boolean
 *                 description: Whether to approve (true) or reject (false) the company
 *                 example: true
 *     responses:
 *       200:
 *         description: Company approval status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company approved successfully
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a superadmin
 *       404:
 *         description: Company not found
 */
router.patch('/company/:id/approve', admin_controller_1.approveCompany);
/**
 * @swagger
 * /api/admin/company/{id}/reject:
 *   patch:
 *     summary: Reject a company
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the company to reject
 *         example: 60d5ec49f8c7d00015f8e3b1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: "Incomplete documentation provided"
 *     responses:
 *       200:
 *         description: Company rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company rejected successfully
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a superadmin
 *       404:
 *         description: Company not found
 */
router.patch('/company/:id/reject', admin_controller_1.rejectCompany);
/**
 * @swagger
 * /api/admin/company/{id}/disable:
 *   patch:
 *     summary: Disable a company account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the company to disable
 *         example: 60d5ec49f8c7d00015f8e3b1
 *     responses:
 *       200:
 *         description: Company disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company disabled successfully
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a superadmin
 *       404:
 *         description: Company not found
 */
router.patch('/company/:id/disable', admin_controller_1.disableCompany);
/**
 * @swagger
 * /api/admin/company/{id}/enable:
 *   patch:
 *     summary: Re-enable a disabled company account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the company to enable
 *         example: 60d5ec49f8c7d00015f8e3b1
 *     responses:
 *       200:
 *         description: Company enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company enabled successfully
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a superadmin
 *       404:
 *         description: Company not found
 */
router.patch('/company/:id/enable', admin_controller_1.enableCompany);
/**
 * @swagger
 * /api/admin/company/{id}/delete:
 *   delete:
 *     summary: Permanently delete a company
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the company to delete
 *         example: 60d5ec49f8c7d00015f8e3b1
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company deleted successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid token
 *       403:
 *         description: Forbidden - not a superadmin
 *       404:
 *         description: Company not found
 */
router.delete('/company/:id/delete', admin_controller_1.deleteCompany);
// List all users - admin only
router.get('/users-all', admin_controller_1.listAllUsers);
// Company profile review endpoints
router.get('/companies/pending-review', admin_controller_1.getCompaniesPendingReview);
router.get('/company/:id', admin_controller_1.getCompanyDetailsForReview);
router.patch('/company/:id/approve-profile', admin_controller_1.approveCompanyProfile);
router.patch('/company/:id/reject-profile', admin_controller_1.rejectCompanyProfile);
router.get('/employees', admin_controller_1.getAllEmployees);
// Admin notifications
router.get('/notifications', admin_controller_1.getAdminNotifications);
router.patch('/notifications/:notificationId/read', admin_controller_1.markAdminNotificationRead);
router.delete('/notifications/:notificationId', admin_controller_1.deleteAdminNotification);
exports.default = router;
