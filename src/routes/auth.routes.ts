import { Router } from 'express';
import { registerEmployee, registerCompany, login } from '../controllers/auth.controller';
import { completeCompanyProfile } from '../controllers/company.controller';
import { authenticateToken } from '../middlewares/authMiddleware';
import uploadSingle, { uploadMultiple } from 'rod-fileupload';
import cloudinary from '../config/cloudinary';

const router = Router();


router.post('/register/employee', registerEmployee);

router.post('/register/company',uploadSingle('logo', cloudinary), registerCompany);

router.post('/login', login);

// Company can submit missing info even before approval
// For backward compatibility, support completing profile under /auth namespace as well
router.patch('/company/complete', authenticateToken, uploadSingle('logo', cloudinary), uploadMultiple('documents', cloudinary), completeCompanyProfile);

export default router;
