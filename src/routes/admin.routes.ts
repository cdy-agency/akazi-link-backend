import { Router } from 'express';
import {
adminLogin,
updateAdminPassword,
getEmployees,
getCompanies,
approveCompany,
} from '../controllers/admin.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', adminLogin); // Admin login does not require prior authentication

router.use(authenticateToken); // All subsequent admin routes require authentication
router.use(authorizeRoles(['superadmin'])); // All subsequent admin routes require superadmin role

router.patch('/update-password', updateAdminPassword);
router.get('/employees', getEmployees);
router.get('/companies', getCompanies);
router.patch('/company/:id/approve', approveCompany);

export default router;
