import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { CvProcessedEmailData } from '../email.types';

export function renderCvProcessedEmail(
  data: CvProcessedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = 'Your CV has been processed';
  const dashboardUrl = data.dashboardUrl || process.env.FRONTEND_URL_DASHBOARD || process.env.APP_URL || '#';
  const body = `
      <h2 style="margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">CV processing complete</h2>
      <p style="color:#374151;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:16px 0;">
        Hello ${data.name}, your CV has been processed successfully. You can review the extracted profile details in your dashboard.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}/dashboard/user/cv" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          View CV
        </a>
      </div>
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
