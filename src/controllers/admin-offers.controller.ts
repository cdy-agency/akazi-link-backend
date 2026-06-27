/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import {
  createOffer,
  getOfferById,
  listOffers,
  sendOffer,
} from '../services/offer.service';

export const listAdminOffers = async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.offerStatus = req.query.status;
    if (req.query.applicationId) filter.applicationId = req.query.applicationId;

    const offers = await listOffers(filter);
    res.status(200).json({
      message: 'Offers retrieved successfully',
      offers,
    });
  } catch (error) {
    console.error('Error listing offers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminOfferById = async (req: Request, res: Response) => {
  try {
    const offer = await getOfferById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    res.status(200).json({
      message: 'Offer retrieved successfully',
      offer,
    });
  } catch (error) {
    console.error('Error getting offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdminOffer = async (req: Request, res: Response) => {
  try {
    const { applicationId, offerLetter, salary, startDate, notes, send } =
      req.body as {
        applicationId?: string;
        offerLetter?: string;
        salary?: string;
        startDate?: string;
        notes?: string;
        send?: boolean;
      };

    if (!applicationId) {
      return res.status(400).json({ message: 'applicationId is required' });
    }

    let offer = await createOffer({
      applicationId,
      offerLetter,
      salary,
      startDate: startDate ? new Date(startDate) : undefined,
      notes,
      createdBy: req.user?.id,
    });

    if (send) {
      offer = await sendOffer(String(offer!._id), req.user?.id);
    }

    res.status(201).json({
      message: send ? 'Offer created and sent' : 'Offer created as draft',
      offer,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message });
    }
    console.error('Error creating offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendAdminOffer = async (req: Request, res: Response) => {
  try {
    const offer = await sendOffer(req.params.id, req.user?.id);
    res.status(200).json({
      message: 'Offer sent successfully',
      offer,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message });
    }
    console.error('Error sending offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
