/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import {
  listCandidateOffers,
  respondToOffer,
} from '../services/offer.service';

export const getEmployeeOffers = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const offers = await listCandidateOffers(employeeId);
    res.status(200).json({
      message: 'Offers retrieved successfully',
      offers,
    });
  } catch (error) {
    console.error('Error getting employee offers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondEmployeeOffer = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { response } = req.body as { response?: 'ACCEPTED' | 'DECLINED' };
    if (response !== 'ACCEPTED' && response !== 'DECLINED') {
      return res.status(400).json({
        message: 'response must be ACCEPTED or DECLINED',
      });
    }

    const offer = await respondToOffer(req.params.id, response, employeeId);
    res.status(200).json({
      message: `Offer ${response.toLowerCase()}`,
      offer,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message });
    }
    console.error('Error responding to offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
