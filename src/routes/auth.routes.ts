import { Router } from 'express';
import { registerEmployee, registerCompany, login, googleLogin, setRole, getCurrentUser } from '../controllers/auth.controller';
import { legacyGoneHandler } from './legacy-deprecation.routes';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post("/google", googleLogin);
router.patch("/google/set-role", authenticateToken, setRole);

router.post('/register/employee', registerEmployee);
router.post('/register/company', registerCompany);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/login', login);

router.patch('/company/complete', legacyGoneHandler);

export default router;
