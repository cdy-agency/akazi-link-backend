import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type {
  InterviewCancelledEmailData,
  InterviewScheduledEmailData,
  InterviewUpdatedEmailData,
} from '../email.types';

function renderInterviewDetails(
  data: InterviewScheduledEmailData,
  title: string,
): string {
  const accentColor = resolveAccentColor(data.accentColor);
  return `
      <h2 style="margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">${title}</h2>
      <p style="color:#374151;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:16px 0;">Hello ${data.name},</p>
      <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="margin:8px 0;color:#374151;"><strong>Position:</strong> ${data.jobTitle}</p>
        <p style="margin:8px 0;color:#374151;"><strong>Scheduled:</strong> ${data.scheduledAt}</p>
        ${data.interviewType ? `<p style="margin:8px 0;color:#374151;"><strong>Type:</strong> ${data.interviewType}</p>` : ''}
        ${data.location ? `<p style="margin:8px 0;color:#374151;"><strong>Location:</strong> ${data.location}</p>` : ''}
        ${data.meetingLink ? `<p style="margin:8px 0;color:#374151;"><strong>Meeting link:</strong> <a href="${data.meetingLink}" style="color:${accentColor};">${data.meetingLink}</a></p>` : ''}
        ${data.notes ? `<p style="margin:8px 0;color:#374151;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
      </div>
      ${data.dashboardUrl ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.dashboardUrl}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          View Interview
        </a>
      </div>` : ''}
    `;
}

export function renderInterviewScheduledEmail(
  data: InterviewScheduledEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = `Interview scheduled: ${data.jobTitle}`;
  const body = renderInterviewDetails(data, 'Interview scheduled');
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      accentColor: resolveAccentColor(data.accentColor),
      logoUrl: resolveLogoUrl(data.logo),
    }),
  };
}

export function renderInterviewUpdatedEmail(
  data: InterviewUpdatedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const subject = `Interview updated: ${data.jobTitle}`;
  const body = renderInterviewDetails(data, 'Interview details updated');
  return {
    subject,
    html: wrapEmail({
      subject,
      bodyContent: body,
      platformName,
      accentColor: resolveAccentColor(data.accentColor),
      logoUrl: resolveLogoUrl(data.logo),
    }),
  };
}

export function renderInterviewCancelledEmail(
  data: InterviewCancelledEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.name;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Interview cancelled: ${data.jobTitle}`;
  const body = `
      <h2 style="margin-bottom:16px;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">Interview cancelled</h2>
      <p style="color:#374151;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:16px 0;">Hello ${data.name}, your interview for <strong>${data.jobTitle}</strong> has been cancelled.</p>
      ${data.scheduledAt ? `<p style="color:#6b7280;margin:8px 0;"><strong>Originally scheduled:</strong> ${data.scheduledAt}</p>` : ''}
      ${data.reason ? `<p style="color:#6b7280;margin:8px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
      ${data.dashboardUrl ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.dashboardUrl}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">Open Dashboard</a>
      </div>` : ''}
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
