import express, { Router } from 'express';
import { listPublicJobs, listPublicUsers, getPublicJobById, getPublicUserById } from '../controllers/public.controller';
import employerRoutes from './employer.routes';
import housekeeperRoutes from './housekeeper.routes';

const router = Router();

router.get('/jobs', listPublicJobs);


router.get('/jobs/:id', getPublicJobById);

router.get('/users', listPublicUsers);
router.get('/users/:id', getPublicUserById)

router.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount new domain routes under /api
router.use('/', employerRoutes);
router.use('/', housekeeperRoutes);

export default router;

