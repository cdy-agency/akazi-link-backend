"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken); // All company routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['company'])); // All company routes require company role and approval
router.get('/profile', company_controller_1.getProfile);
router.patch('/profile', company_controller_1.updateProfile);
router.post('/job', company_controller_1.postJob);
router.get('/jobs', company_controller_1.getCompanyJobs);
router.get('/applicants/:jobId', company_controller_1.getApplicantsForJob);
exports.default = router;
