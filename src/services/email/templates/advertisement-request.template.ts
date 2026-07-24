import {
  EMAIL_PLATFORM,
  resolveAccentColor,
  resolveLogoUrl,
} from '../email.constants';
import { wrapEmail } from './base.template';
import type {
  AdvertisementRequestAdminEmailData,
  AdvertisementRequestSubmittedEmailData,
} from '../email.types';

function placementRows(placements: AdvertisementRequestAdminEmailData['placements']) {
  return placements
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${item.label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${item.recommendedSize}</td>
      </tr>`
    )
    .join('');
}

export function renderAdvertisementRequestAdminEmail(
  data: AdvertisementRequestAdminEmailData
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `New advertising request from ${data.name}`;
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      New advertising request
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Someone requested to advertise on ${platformName}. Review the details below and follow up.
    </p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Contact</p>
      <p style="margin:0 0 4px;color:#111827;font-size:16px;font-weight:600;">${data.name}</p>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">${data.email}</p>
      <p style="margin:0;color:#374151;font-size:14px;">${data.phone}</p>
      ${
        data.companyName
          ? `<p style="margin:12px 0 0;color:#374151;font-size:14px;"><strong>Company:</strong> ${data.companyName}</p>`
          : ''
      }
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Requested placements
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#eff6ff;">
          <th align="left" style="padding:10px 12px;color:#1e3a8a;font-size:13px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">Placement</th>
          <th align="left" style="padding:10px 12px;color:#1e3a8a;font-size:13px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">Recommended size</th>
        </tr>
      </thead>
      <tbody>
        ${placementRows(data.placements)}
      </tbody>
    </table>
    <div style="background:#eff6ff;border-left:4px solid ${accentColor};border-radius:6px;padding:14px 16px;margin:8px 0 24px;">
      <p style="margin:0 0 6px;color:#1e3a8a;font-size:13px;font-weight:600;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">Campaign details</p>
      <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.6;white-space:pre-wrap;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">${data.message}</p>
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

export function renderAdvertisementRequestSubmittedEmail(
  data: AdvertisementRequestSubmittedEmailData
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `We received your advertising request on ${platformName}`;
  const placementList = data.placements
    .map((item) => `<li style="margin:0 0 6px;">${item.label} — <strong>${item.recommendedSize}</strong></li>`)
    .join('');

  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Advertising request received
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Hello ${data.name},
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Thanks for your interest in advertising on ${platformName}. Our team will review your request and contact you soon.
    </p>
    <p style="margin:24px 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Placements you selected
    </p>
    <ul style="color:#374151;font-size:15px;line-height:1.6;padding-left:20px;margin:0 0 24px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      ${placementList}
    </ul>
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${data.homeUrl || '#'}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        Visit ${platformName}
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
