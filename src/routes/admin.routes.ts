import { Router } from 'express';
import {
adminLogin,
updateAdminPassword,
getEmployees,
getCompanies,
approveCompany,
rejectCompany,
disableCompany,
enableCompany,
deleteCompany,
listAllUsers,
getCompaniesPendingReview,
getCompanyDetailsForReview,
approveCompanyProfile,
rejectCompanyProfile,
getAdminNotifications,
markAdminNotificationRead,
deleteAdminNotification,
getLoggedInAdmin
} from '../controllers/admin.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import uploadSingle from 'rod-fileupload';
import cloudinary from '../config/cloudinary';

const router = Router();

router.post('/login', adminLogin); // Admin login does not require prior authentication

router.use(authenticateToken); // All subsequent admin routes require authentication
router.use(authorizeRoles(['superadmin'])); // All subsequent admin routes require superadmin role
router.patch('/update-password',uploadSingle('image', cloudinary), updateAdminPassword);
router.get('/employees', getEmployees);
router.get('/companies', getCompanies);
router.get('/me', getLoggedInAdmin);

router.patch('/company/:id/approve', approveCompany);
router.patch('/company/:id/reject', rejectCompany);
router.patch('/company/:id/disable', disableCompany);
router.patch('/company/:id/enable', enableCompany);

router.delete('/company/:id/delete', deleteCompany);

// List all users - admin only
router.get('/users-all', listAllUsers);

// Company profile review endpoints
router.get('/companies/pending-review', getCompaniesPendingReview);
router.get('/company/:id', getCompanyDetailsForReview);
router.patch('/company/:id/approve-profile', approveCompanyProfile);
router.patch('/company/:id/reject-profile', rejectCompanyProfile);

// Admin notifications
router.get('/notifications', getAdminNotifications);
router.patch('/notifications/:notificationId/read', markAdminNotificationRead);
router.delete('/notifications/:notificationId', deleteAdminNotification);

export default router;
