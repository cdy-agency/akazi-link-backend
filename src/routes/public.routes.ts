import { Router } from 'express';
import { listPublicJobs, listPublicUsers, getPublicJobById, getPublicUserById } from '../controllers/public.controller';

const router = Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs (public)
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category to filter jobs
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/jobs', listPublicJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a specific job by ID (public)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.get('/jobs/:id', getPublicJobById);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (public)
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/users', listPublicUsers);
router.get('/users/:id', getPublicUserById)

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;

