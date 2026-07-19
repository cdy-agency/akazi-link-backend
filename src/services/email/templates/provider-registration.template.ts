import {
  EMAIL_PLATFORM,
  resolveAccentColor,
  resolveLogoUrl,
} from '../email.constants';
import { wrapEmail } from './base.template';
import type {
  ProviderRegistrationApprovedEmailData,
  ProviderRegistrationRejectedEmailData,
  ProviderRegistrationSubmittedEmailData,
} from '../email.types';

function providerTypeLabel(type: 'COMPANY' | 'INDIVIDUAL') {
  return type === 'COMPANY'
    ? 'Service Provider (Company)'
    : 'Service Provider (Individual)';
}

export function renderProviderRegistrationSubmittedEmail(
  data: ProviderRegistrationSubmittedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Your ${platformName} provider account credentials`;
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Registration received
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Hello ${data.name},
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Thank you for registering as a <strong>${providerTypeLabel(data.providerType)}</strong> on ${platformName}.
      Our team will review your application and email you once a decision is made.
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      We created a temporary login for your company account. Use these credentials after your application is approved:
    </p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        Login email
      </p>
      <p style="margin:0 0 20px;color:#111827;font-size:16px;font-weight:600;word-break:break-all;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        ${data.email}
      </p>
      <p style="margin:0 0 12px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        Temporary password
      </p>
      <div style="text-align:center;margin:8px 0 0;">
        <span style="display:inline-block;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:14px 24px;font-size:22px;font-weight:700;letter-spacing:2px;color:${accentColor};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
          ${data.temporaryPassword}
        </span>
      </div>
    </div>
    <div style="background:#eff6ff;border-left:4px solid ${accentColor};border-radius:6px;padding:14px 16px;margin:24px 0;">
      <p style="margin:0;color:#1e3a8a;font-size:14px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        For security, you will be asked to <strong>update this password</strong> the first time you sign in to your provider dashboard.
      </p>
    </div>
    ${
      data.loginUrl
        ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${data.loginUrl}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        Go to Login
      </a>
    </div>`
        : ''
    }
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Keep this email private. If you did not register on ${platformName}, contact support at ${EMAIL_PLATFORM.email}.
    </p>
  `;
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      accentColor,
      logoUrl: resolveLogoUrl(data.logo),
    }),
  };
}

export function renderProviderRegistrationApprovedEmail(
  data: ProviderRegistrationApprovedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = 'Your service provider application is approved';
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#10b981;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Application approved
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Hello ${data.name},
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Your service provider application has been approved. You can now access your provider dashboard.
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Sign in with the email${data.email ? ` (<strong>${data.email}</strong>)` : ''} and temporary password from your registration confirmation email.
      You will be prompted to set a new password after login.
    </p>
    ${
      data.dashboardUrl || data.loginUrl
        ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${data.dashboardUrl || data.loginUrl}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        ${data.dashboardUrl ? 'Open Provider Dashboard' : 'Go to Login'}
      </a>
    </div>`
        : ''
    }
  `;
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      accentColor,
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
