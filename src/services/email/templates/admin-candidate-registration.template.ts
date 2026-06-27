import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { AdminCandidateRegistrationEmailData } from '../email.types';

export function renderAdminCandidateRegistrationEmail(
  data: AdminCandidateRegistrationEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Platform Admin';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `New Employee Registration - ${data.employeeName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">👤 New Employee Registration</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">A new job seeker has registered on the platform.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Employee Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Name:</strong> ${data.employeeName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Email:</strong> ${data.email}</p>
        ${data.position ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Position:</strong> ${data.position}</p>` : ''}
        ${data.experience ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Experience:</strong> ${data.experience}</p>` : ''}
        ${data.phoneNumber ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Phone:</strong> ${data.phoneNumber}</p>` : ''}
        ${data.linkedinProfile ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>LinkedIn:</strong> <a href="${data.linkedinProfile}" style="color:${accentColor};">${data.linkedinProfile}</a></p>` : ''}
        ${data.skills && data.skills.length > 0 ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Skills:</strong> ${data.skills.join(', ')}</p>` : ''}
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
