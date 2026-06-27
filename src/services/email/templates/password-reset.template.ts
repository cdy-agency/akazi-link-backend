import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { PasswordResetEmailData } from '../email.types';

export function renderPasswordResetEmail(
  data: PasswordResetEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.supportTeam;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = data.subject || 'Reset your password';
  const body = `
      <p style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;color:#1f2937;">Dear ${data.name},</p>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">We received a request to reset your password. Click the button below to proceed:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.resetLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#9ca3af;font-size:14px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;line-height:1.5;">If you did not request this, you can safely ignore this email.</p>
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
