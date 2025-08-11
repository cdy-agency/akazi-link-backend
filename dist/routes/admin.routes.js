"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/login', admin_controller_1.adminLogin); // Admin login does not require prior authentication
router.use(authMiddleware_1.authenticateToken); // All subsequent admin routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['superadmin'])); // All subsequent admin routes require superadmin role
router.patch('/update-password', admin_controller_1.updateAdminPassword);
router.get('/employees', admin_controller_1.getEmployees);
router.get('/companies', admin_controller_1.getCompanies);
router.patch('/company/:id/approve', admin_controller_1.approveCompany);
exports.default = router;
