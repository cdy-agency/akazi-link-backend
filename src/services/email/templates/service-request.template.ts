import { EMAIL_PLATFORM, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type {
  ServiceRequestAdminNewEmailData,
  ServiceRequestCustomerStatusEmailData,
  ServiceRequestNewEmailData,
  ServiceRequestSubmittedEmailData,
} from '../email.types';

export function renderServiceRequestSubmittedEmail(
  data: ServiceRequestSubmittedEmailData
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = 'Your service request has been submitted';
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;">Request submitted</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">Hello ${data.customerName},</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      Your request for <strong>${data.serviceName}</strong> with <strong>${data.providerName}</strong> has been submitted successfully.
      The provider will review your request and respond soon.
    </p>
  `;
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      logoUrl: resolveLogoUrl(data.logo),
    }),
  };
}

export function renderServiceRequestCustomerStatusEmail(
  data: ServiceRequestCustomerStatusEmailData,
  title: string,
  message: string
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = title;
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;">${title}</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">Hello ${data.customerName},</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${message}</p>
    ${
      data.note
        ? `<p style="color:#6b7280;font-size:14px;line-height:1.6;"><strong>Note:</strong> ${data.note}</p>`
        : ''
    }
  `;
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      logoUrl: resolveLogoUrl(data.logo),
    }),
  };
}

export function renderServiceRequestAcceptedEmail(
  data: ServiceRequestCustomerStatusEmailData
) {
  return renderServiceRequestCustomerStatusEmail(
    data,
    'Your service request was accepted',
    `Great news! <strong>${data.providerName}</strong> accepted your request for <strong>${data.serviceName}</strong>.`
  );
}

export function renderServiceRequestRejectedEmail(
  data: ServiceRequestCustomerStatusEmailData
) {
  return renderServiceRequestCustomerStatusEmail(
    data,
    'Your service request was declined',
    `Unfortunately, <strong>${data.providerName}</strong> declined your request for <strong>${data.serviceName}</strong>.`
  );
}

export function renderServiceRequestCompletedEmail(
  data: ServiceRequestCustomerStatusEmailData
) {
  return renderServiceRequestCustomerStatusEmail(
    data,
    'Your service request is completed',
    `Your service request for <strong>${data.serviceName}</strong> with <strong>${data.providerName}</strong> has been marked as completed.`
  );
}

export function renderServiceRequestNewEmail(
  data: ServiceRequestNewEmailData
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = 'New service request received';
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;">New request</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">Hello ${data.providerName},</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      <strong>${data.customerName}</strong> submitted a new request for <strong>${data.serviceName}</strong>.
      Log in to your provider dashboard to review and respond.
    </p>
  `;
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      logoUrl: resolveLogoUrl(data.logo),
    }),
  };
}

export function renderServiceRequestAdminNewEmail(
  data: ServiceRequestAdminNewEmailData
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = 'New marketplace service request';
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;">New service request</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      <strong>${data.customerName}</strong> submitted a request for <strong>${data.serviceName}</strong>
      with provider <strong>${data.providerName}</strong>.
    </p>
  `;
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      logoUrl: resolveLogoUrl(data.logo),
    }),
  };
}
