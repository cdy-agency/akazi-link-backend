import { Router } from 'express';
import {
getProfile,
getJobsByCategory,
getJobSuggestions,
applyForJob,
getApplications,
getNotifications,
} from '../controllers/employeeController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken); // All employee routes require authentication
router.use(authorizeRoles(['employee'])); // All employee routes require employee role

router.get('/profile', getProfile);
router.get('/jobs', getJobsByCategory);
router.get('/suggestions', getJobSuggestions);
router.post('/apply/:jobId', applyForJob);
router.get('/applications', getApplications);
router.get('/notifications', getNotifications);

export default router;
