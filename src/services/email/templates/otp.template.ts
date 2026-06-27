import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { OtpEmailData } from '../email.types';

export function renderOtpEmail(data: OtpEmailData): { html: string; subject: string } {
  const subject = 'Your Imihigo verification code';
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const body = `
      <h2 style="margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">
        Verify your email
      </h2>
      ${data.name ? `<p style="color:#374151;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:16px 0;">Hello ${data.name},</p>` : ''}
      <p style="color:#374151;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:16px 0;">
        Enter this verification code to activate your account:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:8px;padding:16px 32px;font-size:32px;font-weight:700;letter-spacing:8px;color:${accentColor};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
          ${data.otp}
        </span>
      </div>
      <p style="color:#6b7280;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;margin:16px 0;">
        This code expires in <strong>${data.expirationMinutes} minutes</strong>.
      </p>
      <p style="color:#9ca3af;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;margin:24px 0 0;">
        If you did not request this code, you can safely ignore this email.
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
