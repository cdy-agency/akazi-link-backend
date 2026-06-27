/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { listCandidateInterviews } from '../services/interview.service';

export const getEmployeeInterviews = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const interviews = await listCandidateInterviews(employeeId);
    res.status(200).json({
      message: 'Interviews retrieved successfully',
      interviews,
    });
  } catch (error) {
    console.error('Error getting employee interviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
