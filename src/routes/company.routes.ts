import { Router } from 'express';
import {
getProfile,
postJob,
getCompanyJobs,
getApplicantsForJob,
updateProfile,
} from '../controllers/company.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken); // All company routes require authentication
router.use(authorizeRoles(['company'])); // All company routes require company role and approval

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/job', postJob);
router.get('/jobs', getCompanyJobs);
router.get('/applicants/:jobId', getApplicantsForJob);

export default router;
