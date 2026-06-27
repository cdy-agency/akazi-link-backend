/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Job from '../models/Job';
import { getRecommendedCandidatesForJob } from '../services/matching.service';

export const getAdminRecommendedCandidates = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const job = await Job.findById(id).select('title skills province district');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const limit = parseInt(req.query.limit as string, 10) || 20;
    const candidates = await getRecommendedCandidatesForJob(id, limit);

    res.status(200).json({
      message: 'Recommended candidates retrieved successfully',
      job: {
        id: job._id,
        title: job.title,
        skills: job.skills,
        province: job.province,
        district: job.district,
      },
      candidates,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    const message = error instanceof Error ? error.message : 'Server error';

    if (statusCode) {
      return res.status(statusCode).json({ message });
    }

    console.error('Error getting recommended candidates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
