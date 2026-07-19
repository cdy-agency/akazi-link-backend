import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  changeProviderPasswordSchema,
  updateServiceRequestStatusSchema,
} from '../validators/marketplace.validator';
import {
  getServiceRequestById,
  listProviderServiceRequests,
  updateServiceRequestStatus,
} from '../services/marketplace/service-request.service';
import ServiceProvider from '../models/ServiceProvider';
import { comparePasswords, hashPassword } from '../utils/authUtils';
import {
  listProviderNotifications,
  markProviderNotificationRead,
} from '../services/marketplace/marketplace-notification.service';

function validationError(res: Response, error: ZodError) {
  const message = error.issues[0]?.message || 'Validation failed';
  return res.status(400).json({ message });
}

export const listProviderServiceRequestsHandler = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    const result = await listProviderServiceRequests(req.user!.id, {
      status: typeof status === 'string' ? status : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('listProviderServiceRequestsHandler error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProviderServiceRequestById = async (req: Request, res: Response) => {
  try {
    const request = await getServiceRequestById(req.params.id);
    if (String((request as any).providerId?._id || request.providerId) !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.status(200).json({ request });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const updateProviderServiceRequestStatus = async (req: Request, res: Response) => {
  try {
    const parsed = updateServiceRequestStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const request = await updateServiceRequestStatus(
      req.params.id,
      parsed.data.status,
      { id: req.user!.id, role: 'service_provider' },
      parsed.data.note
    );

    res.status(200).json({ request });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const changeProviderPassword = async (req: Request, res: Response) => {
  try {
    const parsed = changeProviderPasswordSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const provider = await ServiceProvider.findById(req.user!.id);
    if (!provider) {
      return res.status(404).json({ message: 'Service provider not found' });
    }

    const isMatch = await comparePasswords(
      parsed.data.currentPassword,
      provider.password
    );
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    provider.password = await hashPassword(parsed.data.newPassword);
    provider.mustChangePassword = false;
    await provider.save();

    res.status(200).json({
      message: 'Password updated successfully',
      mustChangePassword: false,
    });
  } catch (error) {
    console.error('changeProviderPassword error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const listProviderNotificationsHandler = async (req: Request, res: Response) => {
  try {
    const notifications = await listProviderNotifications(req.user!.id);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('listProviderNotificationsHandler error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markProviderNotificationReadHandler = async (req: Request, res: Response) => {
  try {
    const notification = await markProviderNotificationRead(req.user!.id, req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json({ notification });
  } catch (error) {
    console.error('markProviderNotificationReadHandler error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
