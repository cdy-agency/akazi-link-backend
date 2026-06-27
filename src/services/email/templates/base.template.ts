import { EMAIL_PLATFORM, normalizeLogoUrl } from '../email.constants';

const FONT_STACK =
  "'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif";

export type BaseTemplateOptions = {
  subject: string;
  bodyContent: string;
  platformName?: string;
  accentColor?: string;
  logoUrl?: string;
};

export function wrapEmail({
  subject,
  bodyContent,
  platformName = EMAIL_PLATFORM.name,
  accentColor = EMAIL_PLATFORM.accentColor,
  logoUrl = EMAIL_PLATFORM.logoUrl,
}: BaseTemplateOptions): string {
  const normalizedLogo = normalizeLogoUrl(logoUrl);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>
      body { font-family: ${FONT_STACK}; margin:0; padding:0; background:#f1f5f9; font-size:16px; }
      .container { max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.1); }
      .content { padding:30px 40px; font-size:16px; line-height:1.6; }
    </style>
  </head>
  <body>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0">
            ${renderHeader(platformName, normalizedLogo)}
            <tr><td class="content">${bodyContent}</td></tr>
            ${renderFooter(platformName, year)}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderHeader(platformName: string, logoUrl: string): string {
  const logoBlock = logoUrl
    ? `<td style="vertical-align:middle;padding-right:12px;">
        <img src="${logoUrl}" alt="${platformName}" width="48" height="48" style="display:block;border-radius:8px;" />
      </td>`
    : '';

  return `<tr>
  <td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e5e7eb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              ${logoBlock}
              <td style="vertical-align:middle;">
                <div style="color:#1f2937;font-size:22px;font-weight:700;line-height:1.2;margin:0;font-family:${FONT_STACK};">
                  ${platformName}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function renderFooter(platformName: string, year: number): string {
  return `<tr>
    <td style="background:#f9fafb;padding:24px 20px;text-align:center;font-size:14px;color:#6b7280;font-family:${FONT_STACK};">
      <p style="margin:0 0 8px 0;">© ${year} ${platformName}. All rights reserved.</p>
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        ${EMAIL_PLATFORM.phone} ·
        <a href="mailto:${EMAIL_PLATFORM.email}" style="color:#6b7280;text-decoration:none;">${EMAIL_PLATFORM.email}</a>
      </p>
    </td>
  </tr>`;
}
