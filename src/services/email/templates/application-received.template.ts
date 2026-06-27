import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { ApplicationReceivedEmailData } from '../email.types';

export function renderApplicationReceivedEmail(
  data: ApplicationReceivedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.supportTeam;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `New Application: ${data.jobTitle} - ${data.applicantName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">📋 New Job Application Received</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">You have received a new application for the position: <strong>${data.jobTitle}</strong></p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Applicant Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Name:</strong> ${data.applicantName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Email:</strong> ${data.applicantEmail}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Position Applied:</strong> ${data.jobTitle}</p>
        ${data.experience ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Experience:</strong> ${data.experience}</p>` : ''}
        ${data.skills && data.skills.length > 0 ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Skills:</strong> ${data.skills.join(', ')}</p>` : ''}
        ${data.coverLetter ? `
        <div style="margin-top:16px;">
          <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Cover Letter:</strong></p>
          <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:6px;padding:16px;margin-top:8px;font-size:16px;line-height:1.6;color:#374151;">
            ${data.coverLetter}
          </div>
        </div>
        ` : ''}
      </div>
      <div style="text-align:center;margin:32px 0;">
        ${data.applicantProfileLink ? `
        <a href="${data.applicantProfileLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;margin-right:12px;">
          View Profile
        </a>
        ` : ''}
        ${data.resumeLink ? `
        <a href="${data.resumeLink}" style="background:#6b7280;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          Download Resume
        </a>
        ` : ''}
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
