import { Request, Response } from 'express';
import Job from '../models/Job';

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Publicly accessible endpoints
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List all jobs (public)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *       500:
 *         description: Server error
 */
export const listPublicJobs = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const query: any = {};

    if (category && typeof category === 'string') {
      query.category = category;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .populate('companyId', 'companyName logo location');

    res.status(200).json({ message: 'Jobs retrieved successfully', jobs });
  } catch (error) {
    console.error('Error listing public jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

