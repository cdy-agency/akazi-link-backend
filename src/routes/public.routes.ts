import { Router } from 'express';
import { listPublicJobs, listPublicUsers, getPublicJobById, getPublicUserById } from '../controllers/public.controller';

const router = Router();

router.get('/jobs', listPublicJobs);


router.get('/jobs/:id', getPublicJobById);

router.get('/users', listPublicUsers);
router.get('/users/:id', getPublicUserById)

router.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;

