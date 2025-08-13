import { Router } from 'express';
import { listPublicJobs } from '../controllers/public.controller';

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

export default router;

