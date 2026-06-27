import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { WelcomeEmailData } from '../email.types';

export function renderWelcomeEmail(data: WelcomeEmailData): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.supportTeam;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = data.subject || `Welcome to ${platformName}`;
  const dashboardUrl = data.dashboardUrl || 'https://yourapp.com/dashboard';
  const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:26px;font-weight:600;color:#1f2937;">Welcome aboard, ${data.name} 🎉</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;line-height:1.6;margin:20px 0;">We're excited to have you at <strong>${platformName}</strong>. Get started by exploring your dashboard and setting up your profile.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;display:inline-block;">
          Go to Dashboard
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
