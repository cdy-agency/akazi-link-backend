import { Router } from 'express';
import {
  registerCandidate,
  sendOtp,
  verifyEmail,
} from '../controllers/candidate-auth.controller';

const router = Router();

router.post('/register/candidate', registerCandidate);
router.post('/otp/send', sendOtp);
router.post('/verify-email', verifyEmail);

export default router;
