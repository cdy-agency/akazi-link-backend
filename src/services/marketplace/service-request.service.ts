import ServiceRequest from '../../models/ServiceRequest';
import ServiceProvider from '../../models/ServiceProvider';
import Service from '../../models/Service';
import { emailService } from '../email/email.service';
import { EmailTemplate } from '../email/email.types';
import { createProviderNotification } from './marketplace-notification.service';
import AdminNotification from '../../models/AdminNotification';
import { PUBLIC_PROVIDER_STATUSES } from '../../config/marketplace.config';

const PROVIDER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ACCEPTED', 'REJECTED', 'PENDING'],
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['COMPLETED'],
};

const ADMIN_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CANCELLED'],
  PENDING: ['CANCELLED'],
  ACCEPTED: ['CANCELLED'],
  IN_PROGRESS: ['CANCELLED'],
};

function appendStatusHistory(
  request: any,
  status: string,
  changedBy?: string,
  changedByRole?: string,
  note?: string
) {
  request.status = status;
  request.statusHistory.push({
    status,
    note,
    changedBy,
    changedByRole,
    createdAt: new Date(),
  });
}

async function sendCustomerStatusEmail(
  request: any,
  template: EmailTemplate,
  extra?: Record<string, unknown>
) {
  if (!request.customerEmail) return;

  const provider = await ServiceProvider.findById(request.providerId).lean();
  const service = await Service.findById(request.serviceId).lean();

  await emailService.send({
    to: request.customerEmail,
    template,
    data: {
      customerName: request.customerName,
      providerName: provider?.displayName || 'Service provider',
      serviceName: service?.name || 'Service',
      status: request.status,
      note: extra?.note as string | undefined,
    },
  });
}

export async function createServiceRequest(
  input: {
    providerId: string;
    serviceId: string;
    customerName: string;
    customerPhone: string;
    customerWhatsapp: string;
    customerEmail?: string;
    preferredContactMethod: string;
    preferredDate?: string;
    province: string;
    district: string;
    sector?: string;
    address: string;
    description: string;
    attachments?: unknown[];
  },
  customerId?: string
) {
  const provider = await ServiceProvider.findOne({
    _id: input.providerId,
    status: { $in: PUBLIC_PROVIDER_STATUSES },
    isActive: { $ne: false },
  }).lean();

  if (!provider) {
    throw Object.assign(new Error('Provider not found or not available'), {
      statusCode: 404,
    });
  }

  const service = await Service.findOne({
    _id: input.serviceId,
    isActive: true,
  }).lean();

  if (!service) {
    throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  }

  const request = await ServiceRequest.create({
    customerId: customerId || null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerWhatsapp: input.customerWhatsapp,
    customerEmail: input.customerEmail || undefined,
    preferredContactMethod: input.preferredContactMethod,
    providerId: input.providerId,
    serviceId: input.serviceId,
    preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
    province: input.province,
    district: input.district,
    sector: input.sector,
    address: input.address,
    description: input.description,
    attachments: input.attachments || [],
    status: 'NEW',
    statusHistory: [
      {
        status: 'NEW',
        changedByRole: customerId ? 'customer' : 'guest',
        createdAt: new Date(),
      },
    ],
  });

  await createProviderNotification({
    providerId: input.providerId,
    type: 'SERVICE_REQUEST_NEW',
    title: 'New service request',
    message: `${input.customerName} requested ${service.name}.`,
    metadata: { requestId: String(request._id) },
  });

  await AdminNotification.create({
    message: `New service request from ${input.customerName} for ${service.name} (${provider.displayName})`,
    read: false,
    createdAt: new Date(),
  });

  if (provider.email) {
    await emailService.send({
      to: provider.email,
      template: EmailTemplate.SERVICE_REQUEST_NEW,
      data: {
        providerName: provider.displayName,
        customerName: input.customerName,
        serviceName: service.name,
        requestId: String(request._id),
      },
    });
  }

  if (input.customerEmail) {
    await emailService.send({
      to: input.customerEmail,
      template: EmailTemplate.SERVICE_REQUEST_SUBMITTED,
      data: {
        customerName: input.customerName,
        providerName: provider.displayName,
        serviceName: service.name,
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL;
  if (adminEmail) {
    await emailService.send({
      to: adminEmail,
      template: EmailTemplate.SERVICE_REQUEST_ADMIN_NEW,
      data: {
        customerName: input.customerName,
        providerName: provider.displayName,
        serviceName: service.name,
      },
    });
  }

  return request;
}

export async function listProviderServiceRequests(
  providerId: string,
  filters?: { status?: string; page?: number; limit?: number }
) {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 20, 100);
  const query: Record<string, unknown> = { providerId };
  if (filters?.status) query.status = filters.status;

  const [items, total] = await Promise.all([
    ServiceRequest.find(query)
      .populate('serviceId', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ServiceRequest.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function listAdminServiceRequests(filters?: {
  status?: string;
  providerId?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 20, 100);
  const query: Record<string, unknown> = {};
  if (filters?.status) query.status = filters.status;
  if (filters?.providerId) query.providerId = filters.providerId;

  const [items, total] = await Promise.all([
    ServiceRequest.find(query)
      .populate('serviceId', 'name slug')
      .populate('providerId', 'displayName slug email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ServiceRequest.countDocuments(query),
  ]);

  return { items, total, page, limit };
}

export async function getServiceRequestById(id: string) {
  const request = await ServiceRequest.findById(id)
    .populate('serviceId', 'name slug categoryId')
    .populate('providerId', 'displayName slug email phone whatsapp')
    .lean();

  if (!request) {
    throw Object.assign(new Error('Service request not found'), { statusCode: 404 });
  }

  return request;
}

export async function updateServiceRequestStatus(
  id: string,
  status: string,
  actor: { id?: string; role: string },
  note?: string
) {
  const request = await ServiceRequest.findById(id);
  if (!request) {
    throw Object.assign(new Error('Service request not found'), { statusCode: 404 });
  }

  const allowed =
    actor.role === 'superadmin'
      ? ADMIN_ALLOWED_TRANSITIONS[request.status] || []
      : PROVIDER_ALLOWED_TRANSITIONS[request.status] || [];

  if (!allowed.includes(status)) {
    throw Object.assign(
      new Error(`Cannot transition from ${request.status} to ${status}`),
      { statusCode: 400 }
    );
  }

  if (actor.role === 'service_provider' && String(request.providerId) !== actor.id) {
    throw Object.assign(new Error('Access denied'), { statusCode: 403 });
  }

  appendStatusHistory(request, status, actor.id, actor.role, note);
  await request.save();

  if (status === 'ACCEPTED') {
    await sendCustomerStatusEmail(request, EmailTemplate.SERVICE_REQUEST_ACCEPTED, { note });
  } else if (status === 'REJECTED') {
    await sendCustomerStatusEmail(request, EmailTemplate.SERVICE_REQUEST_REJECTED, { note });
  } else if (status === 'COMPLETED') {
    await sendCustomerStatusEmail(request, EmailTemplate.SERVICE_REQUEST_COMPLETED, { note });
  }

  return request;
}
