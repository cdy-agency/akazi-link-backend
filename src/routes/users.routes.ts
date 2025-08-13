import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';
import { listAllUsers } from '../controllers/admin.controller';

const router = Router();

// Admin-only users listing at /api/users
router.use(authenticateToken);
router.use(authorizeRoles(['superadmin']));
router.get('/users', listAllUsers);

export default router;

