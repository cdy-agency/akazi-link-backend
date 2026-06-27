import { EMAIL_PLATFORM, resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type { OfferSentEmailData } from '../email.types';

export function renderOfferSentEmail(
  data: OfferSentEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || EMAIL_PLATFORM.supportTeam;
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Job Offer: ${data.jobTitle} at ${data.companyName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">🎉 Congratulations! Job Offer Received</h2>
      <p style="margin-bottom:24px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:#3c4043;font-size:16px;">Dear ${data.employeeName},</p>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        Great news! <strong>${data.companyName}</strong> would like to offer you the position of <strong>${data.jobTitle}</strong>.
      </p>
      <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Offer Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Company:</strong> ${data.companyName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Position:</strong> ${data.jobTitle}</p>
        ${data.salary ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Salary:</strong> ${data.salary}</p>` : ''}
        ${data.location ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Location:</strong> ${data.location}</p>` : ''}
        ${data.startDate ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Start Date:</strong> ${data.startDate}</p>` : ''}
        ${data.offerExpiryDate ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#ef4444;"><strong>Offer Expires:</strong> ${data.offerExpiryDate}</p>` : ''}
        ${data.jobDescription ? `
        <div style="margin-top:16px;">
          <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Job Description:</strong></p>
          <div style="color:#374151;font-size:16px;line-height:1.6;margin-top:8px;">${data.jobDescription}</div>
        </div>
        ` : ''}
        ${data.benefits && data.benefits.length > 0 ? `
        <div style="margin-top:16px;">
          <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Benefits:</strong></p>
          <ul style="color:#374151;font-size:16px;line-height:1.6;margin:8px 0;padding-left:20px;">
            ${data.benefits.map((benefit) => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      ${data.acceptOfferLink ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.acceptOfferLink}" style="background:#10b981;color:#fff;padding:16px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;display:inline-block;margin-right:12px;">
          Accept Offer
        </a>
        <a href="${data.acceptOfferLink.replace('/accept', '/decline')}" style="background:#6b7280;color:#fff;padding:16px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;display:inline-block;">
          Decline Offer
        </a>
      </div>
      ` : ''}
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        Please review the offer details carefully. If you have any questions, feel free to contact the company directly or reach out to our support team.
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
