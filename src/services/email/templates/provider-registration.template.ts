import { EMAIL_PLATFORM, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type {
  ProviderRegistrationApprovedEmailData,
  ProviderRegistrationRejectedEmailData,
  ProviderRegistrationSubmittedEmailData,
} from '../email.types';

function providerTypeLabel(type: 'COMPANY' | 'INDIVIDUAL') {
  return type === 'COMPANY' ? 'Service Provider (Company)' : 'Service Provider (Individual)';
}

export function renderProviderRegistrationSubmittedEmail(
  data: ProviderRegistrationSubmittedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = 'Service provider registration received';
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;">Registration submitted</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">Hello ${data.name},</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      Thank you for registering as a <strong>${providerTypeLabel(data.providerType)}</strong> on ${platformName}.
      Our team will review your application and notify you once a decision is made.
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

export function renderProviderRegistrationApprovedEmail(
  data: ProviderRegistrationApprovedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = 'Your service provider application is approved';
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#10b981;margin-bottom:16px;">Application approved</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">Hello ${data.name},</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      Your service provider application has been approved. You can now access your provider dashboard.
    </p>
    ${data.dashboardUrl ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${data.dashboardUrl}" style="background:#0866ff;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">
        Open Provider Dashboard
      </a>
    </div>` : ''}
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

export function renderProviderRegistrationRejectedEmail(
  data: ProviderRegistrationRejectedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = 'Service provider application update';
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#ef4444;margin-bottom:16px;">Application not approved</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">Hello ${data.name},</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;">
      Unfortunately your service provider application was not approved at this time.
    </p>
    ${data.reason ? `<p style="color:#6b7280;font-size:15px;line-height:1.6;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
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
