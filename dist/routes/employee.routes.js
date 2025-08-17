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
const employee_controller_1 = require("../controllers/employee.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rod_fileupload_1 = __importStar(require("rod-fileupload"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken); // All employee routes require authentication
router.use((0, authMiddleware_1.authorizeRoles)(['employee'])); // All employee routes require employee role
router.get('/profile', employee_controller_1.getProfile);
router.patch('/profile', employee_controller_1.updateEmployeeProfile);
router.post('/upload/image', (0, rod_fileupload_1.default)('image', cloudinary_1.default), employee_controller_1.uploadProfileImage);
router.post('/upload/documents', (0, rod_fileupload_1.uploadMultiple)('documents', cloudinary_1.default), employee_controller_1.uploadEmployeeDocuments);
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
