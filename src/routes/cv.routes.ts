import { Router } from 'express';
import {
  getProfileReview,
  patchProfileReview,
} from '../controllers/cv-profile-review.controller';
import {
  authenticateToken,
  authorizeRoles,
  ensureEmployeeActive,
} from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(['employee']));

router.get('/profile-review', getProfileReview);
router.patch('/profile-review', ensureEmployeeActive(), patchProfileReview);

export default router;
