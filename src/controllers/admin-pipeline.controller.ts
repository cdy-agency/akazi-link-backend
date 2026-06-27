/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { getPipelineMetrics } from '../services/pipeline-metrics.service';

export const getAdminPipelineMetrics = async (_req: Request, res: Response) => {
  try {
    const metrics = await getPipelineMetrics();
    res.status(200).json({
      message: 'Pipeline metrics retrieved successfully',
      metrics,
    });
  } catch (error) {
    console.error('Error getting pipeline metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
