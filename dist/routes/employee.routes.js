"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rod_fileupload_1 = require("rod-fileupload");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const company_controller_1 = require("../controllers/company.controller");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken); // All employee routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['employee'])); // All employee routes require employee role
router.get('/profile', employee_controller_1.getProfile);
router.patch('/profile', (0, rod_fileupload_1.uploadMultiple)('image', cloudinary_1.default), employee_controller_1.updateEmployeeProfile);
router.post('/upload/documents', (0, rod_fileupload_1.uploadMultiple)('documents', cloudinary_1.default), company_controller_1.uploadDocuments);
router.get('/jobs', employee_controller_1.getJobsByCategory);
router.get('/suggestions', employee_controller_1.getJobSuggestions);
router.post('/apply/:jobId', employee_controller_1.applyForJob);
router.get('/applications', employee_controller_1.getApplications);
router.get('/notifications', employee_controller_1.getNotifications);
router.patch('/notifications/:notificationId/read', employee_controller_1.markNotificationRead);
router.delete('/notifications/:notificationId', employee_controller_1.deleteEmployeeNotification);
// Work requests
router.get('/work-requests', employee_controller_1.listWorkRequests);
router.patch('/work-requests/:id/respond', employee_controller_1.respondWorkRequest);
exports.default = router;
