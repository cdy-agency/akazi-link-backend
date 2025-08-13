"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken); // All employee routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['employee'])); // All employee routes require employee role
router.get('/profile', employee_controller_1.getProfile);
router.get('/jobs', employee_controller_1.getJobsByCategory);
router.get('/suggestions', employee_controller_1.getJobSuggestions);
router.post('/apply/:jobId', employee_controller_1.applyForJob);
router.get('/applications', employee_controller_1.getApplications);
router.get('/notifications', employee_controller_1.getNotifications);
exports.default = router;
