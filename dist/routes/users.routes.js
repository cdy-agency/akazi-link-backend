"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// Admin-only users listing at /api/users
router.use(authMiddleware_1.authenticateToken);
router.use((0, authMiddleware_1.authorizeRoles)(['superadmin']));
router.get('/users', admin_controller_1.listAllUsers);
exports.default = router;
