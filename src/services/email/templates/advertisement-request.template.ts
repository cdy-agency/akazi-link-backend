import {
  EMAIL_PLATFORM,
  resolveAccentColor,
  resolveLogoUrl,
} from '../email.constants';
import { wrapEmail } from './base.template';
import type {
  AdvertisementRequestAdminEmailData,
  AdvertisementRequestSubmittedEmailData,
  AdvertisementRequestStatusEmailData,
} from '../email.types';

function placementRows(
  placements: AdvertisementRequestAdminEmailData['placements']
) {
  if (!placements?.length) return '';
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
  const placementsHtml = placementRows(data.placements);
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      New advertising request
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Someone submitted a free image ad request on ${platformName}. Choose placement and publish it from the admin dashboard.
    </p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Contact</p>
      <p style="margin:0 0 4px;color:#111827;font-size:16px;font-weight:600;">${data.name}</p>
      <p style="margin:0;color:#374151;font-size:14px;">${data.phone}</p>
      ${
        data.email
          ? `<p style="margin:4px 0 0;color:#374151;font-size:14px;">${data.email}</p>`
          : ''
      }
      ${
        data.companyName
          ? `<p style="margin:12px 0 0;color:#374151;font-size:14px;"><strong>Company:</strong> ${data.companyName}</p>`
          : ''
      }
      ${
        data.linkUrl
          ? `<p style="margin:12px 0 0;color:#374151;font-size:14px;"><strong>Link URL:</strong> <a href="${data.linkUrl}">${data.linkUrl}</a></p>`
          : ''
      }
      <p style="margin:12px 0 0;color:#374151;font-size:14px;"><strong>Package:</strong> ${data.packageType || 'FREE'} (image)</p>
    </div>
    ${
      data.mediaUrl
        ? `<p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">Uploaded creative</p>
    <div style="margin:0 0 24px;">
      <a href="${data.mediaUrl}" style="display:inline-block;margin-bottom:12px;color:${accentColor};font-weight:600;">Open image</a>
      <div><img src="${data.mediaUrl}" alt="Ad creative" style="max-width:100%;max-height:280px;border-radius:8px;border:1px solid #e5e7eb;" /></div>
    </div>`
        : ''
    }
    ${
      placementsHtml
        ? `<p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
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
        ${placementsHtml}
      </tbody>
    </table>`
        : `<p style="margin:0 0 24px;color:#6b7280;font-size:14px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Placement was not selected by the requester — choose it when creating the advertisement.
    </p>`
    }
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
  const placementList = (data.placements || [])
    .map(
      (item) =>
        `<li style="margin:0 0 6px;">${item.label} — <strong>${item.recommendedSize}</strong></li>`
    )
    .join('');

  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Advertising request received
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Hello ${data.name},
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Thanks for your interest in advertising on ${platformName}. We received your free image ad request. Our team will choose the best placement and contact you soon.
    </p>
    ${
      placementList
        ? `<p style="margin:24px 0 8px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Placements you selected
    </p>
    <ul style="color:#374151;font-size:15px;line-height:1.6;padding-left:20px;margin:0 0 24px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      ${placementList}
    </ul>`
        : ''
    }
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

export function renderAdvertisementRequestApprovedEmail(
  data: AdvertisementRequestStatusEmailData
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Your advertising request was approved — ${platformName}`;

  const formatScheduleDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const startLabel = formatScheduleDate(data.startDate);
  const endLabel = formatScheduleDate(data.endDate);
  const scheduleHtml =
    startLabel && endLabel
      ? `<p style="margin:16px 0 0;color:#374151;font-size:15px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;"><strong>Campaign schedule:</strong><br/>Starts ${startLabel}<br/>Expires ${endLabel}</p>`
      : '';

  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Advertising request approved
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Hello ${data.name},
    </p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:8px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0;color:#1f2937;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        Good news — your free image ad request on ${platformName} has been <strong>approved</strong> and scheduled for publication.
      </p>
      ${scheduleHtml}
      ${
        data.adminNote
          ? `<p style="margin:16px 0 0;color:#374151;font-size:15px;line-height:1.6;white-space:pre-wrap;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;"><strong>Note from our team:</strong><br/>${data.adminNote}</p>`
          : ''
      }
    </div>
    ${
      data.homeUrl
        ? `<div style="text-align:center;margin:28px 0 8px;">
      <a href="${data.homeUrl}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        Visit ${platformName}
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

export function renderAdvertisementRequestRejectedEmail(
  data: AdvertisementRequestStatusEmailData
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Update on your advertising request — ${platformName}`;
  const body = `
    <h2 style="font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Advertising request update
    </h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      Hello ${data.name},
    </p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0;color:#1f2937;font-size:16px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
        Thank you for your interest in advertising on ${platformName}. Unfortunately, we are unable to approve your ad request at this time.
      </p>
      ${
        data.adminNote
          ? `<p style="margin:16px 0 0;color:#374151;font-size:15px;line-height:1.6;white-space:pre-wrap;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;"><strong>Note from our team:</strong><br/>${data.adminNote}</p>`
          : ''
      }
    </div>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
      You may reply to this email or contact us if you have questions.
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
