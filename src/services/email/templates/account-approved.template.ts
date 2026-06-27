import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { AccountApprovedEmailData, AccountRejectedEmailData } from '../email.types';

export function renderAccountApprovedEmail(
  data: AccountApprovedEmailData,
): { html: string; subject: string } {
  const registeredName = data.companyName || data.accountName;
  const platformName = data.platformName || EMAIL_PLATFORM.supportTeam;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Company Application Approved - ${registeredName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">✅ Company Application Approved</h2>
      <p style="margin-bottom:24px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:#3c4043;font-size:16px;">Dear ${data.accountName},</p>
      <div style="background:#f9fafb;border-left:4px solid #10b981;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;margin:0 0 12px 0;color:#1f2937;font-weight:600;">
          Your company registration for <strong>${registeredName}</strong> has been approved.
        </p>
        ${data.message ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;margin:0;">${data.message}</p>` : ''}
      </div>
      ${data.dashboardLink ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.dashboardLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          Access Your Dashboard
        </a>
      </div>
      ` : ''}
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        Welcome to our platform! You can now start posting jobs and managing your company profile.
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

export function renderAccountRejectedEmail(
  data: AccountRejectedEmailData,
): { html: string; subject: string } {
  const registeredName = data.companyName || data.accountName;
  const platformName = data.platformName || EMAIL_PLATFORM.supportTeam;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Company Application Rejected - ${registeredName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">❌ Company Application Rejected</h2>
      <p style="margin-bottom:24px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:#3c4043;font-size:16px;">Dear ${data.accountName},</p>
      <div style="background:#f9fafb;border-left:4px solid #ef4444;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;margin:0 0 12px 0;color:#1f2937;font-weight:600;">
          Your company registration for <strong>${registeredName}</strong> has been rejected.
        </p>
        ${data.message ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;margin:0;">${data.message}</p>` : ''}
      </div>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        If you have any questions about this decision, please don't hesitate to contact our support team.
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
