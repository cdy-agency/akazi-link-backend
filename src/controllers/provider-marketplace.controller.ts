import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { updateServiceRequestStatusSchema } from '../validators/marketplace.validator';
import {
  getServiceRequestById,
  listProviderServiceRequests,
  updateServiceRequestStatus,
} from '../services/marketplace/service-request.service';

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
