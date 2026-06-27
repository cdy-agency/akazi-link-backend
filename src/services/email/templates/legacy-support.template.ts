import { resolveAccentColor, resolveLogoUrl } from '../email.constants';
import { wrapEmail } from './base.template';
import type {
  AdminCompanyProfileCompletedEmailData,
  AdminCompanyRegistrationEmailData,
  AdminContactMessageEmailData,
  EmployerRegistrationEmailData,
  GenericMessageEmailData,
  HiredNotificationEmailData,
  HousekeeperRegistrationEmailData,
  OfferResponseEmailData,
} from '../email.types';

export function renderAdminCompanyRegistrationEmail(
  data: AdminCompanyRegistrationEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Platform Admin';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `New Company Registration - ${data.companyName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-size:24px;font-weight:600;color:#1f2937;">🏢 New Company Registration</h2>
      <p style="color:#6b7280;font-size:16px;line-height:1.6;">A new company has registered on the platform and is awaiting approval.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="margin:8px 0;color:#374151;"><strong>Company Name:</strong> ${data.companyName}</p>
        <p style="margin:8px 0;color:#374151;"><strong>Email:</strong> ${data.email}</p>
        ${data.location ? `<p style="margin:8px 0;color:#374151;"><strong>Location:</strong> ${data.location}</p>` : ''}
        ${data.website ? `<p style="margin:8px 0;color:#374151;"><strong>Website:</strong> <a href="${data.website}" style="color:${accentColor};">${data.website}</a></p>` : ''}
        ${data.phoneNumber ? `<p style="margin:8px 0;color:#374151;"><strong>Phone:</strong> ${data.phoneNumber}</p>` : ''}
        ${data.description ? `<p style="margin:8px 0;color:#374151;"><strong>Description:</strong></p><div style="color:#374151;line-height:1.6;margin-top:8px;">${data.description}</div>` : ''}
      </div>
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}

export function renderAdminCompanyProfileCompletedEmail(
  data: AdminCompanyProfileCompletedEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Platform Admin';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Company Profile Completed - ${data.companyName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-size:24px;font-weight:600;color:#1f2937;">🏢 Company Profile Completed</h2>
      <p style="color:#6b7280;font-size:16px;line-height:1.6;">The company <strong>${data.companyName}</strong> has completed its profile and is ready for review.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.dashboardLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">View in Dashboard</a>
      </div>
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}

export function renderGenericMessageEmail(
  data: GenericMessageEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Support Team';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = data.subject;
  const body = `
      <p style="margin-bottom:24px;color:#3c4043;font-size:16px;">Hello ${data.contactName},</p>
      <div style="font-size:16px;line-height:1.6;color:#3c4043;margin:24px 0;">${data.content}</div>
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}

export function renderHiredNotificationEmail(
  data: HiredNotificationEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Recruitment Team';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `Congratulations! You've Been Hired - ${data.jobTitle}`;
  const body = `
      <h2 style="margin-bottom:16px;font-size:24px;font-weight:600;color:#1f2937;">🎉 Congratulations! You've Been Hired!</h2>
      <p style="margin-bottom:24px;color:#3c4043;font-size:16px;">Dear ${data.employeeName},</p>
      <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="margin:8px 0;color:#374151;"><strong>Company:</strong> ${data.companyName}</p>
        <p style="margin:8px 0;color:#374151;"><strong>Position:</strong> ${data.jobTitle}</p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="font-size:16px;line-height:1.6;color:#374151;margin:0;">
          ${data.customMessage || `Congratulations! You have been hired for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong>. Our team will reach out with next steps.`}
        </p>
      </div>
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}

export function renderOfferResponseEmail(
  data: OfferResponseEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || data.companyDisplayName;
  const accentColor = resolveAccentColor(data.accentColor);
  const isAccepted = data.action === 'accepted';
  const statusColor = isAccepted ? '#10b981' : '#ef4444';
  const subject = `Offer ${isAccepted ? 'Accepted' : 'Rejected'}: ${data.jobTitle} - ${data.employeeName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-size:24px;font-weight:600;color:#1f2937;">Offer ${isAccepted ? 'Accepted' : 'Rejected'}</h2>
      <p style="color:#6b7280;font-size:16px;line-height:1.6;">
        ${data.employeeName} has <strong style="color:${statusColor}">${data.action}</strong> your offer for <strong>${data.jobTitle}</strong>.
      </p>
      ${data.message ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">${data.message}</div>` : ''}
      ${data.viewRequestLink ? `<div style="text-align:center;margin:24px 0;"><a href="${data.viewRequestLink}" style="background:${accentColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">View Request</a></div>` : ''}
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}

export function renderEmployerRegistrationEmail(
  data: EmployerRegistrationEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Platform Admin';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `New Employer Registration - ${data.employerName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-size:24px;font-weight:600;color:#1f2937;">👔 New Employer Registration</h2>
      <p style="color:#6b7280;font-size:16px;line-height:1.6;">A new employer has registered on the platform.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="margin:8px 0;color:#374151;"><strong>Name:</strong> ${data.employerName}</p>
        <p style="margin:8px 0;color:#374151;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin:8px 0;color:#374151;"><strong>National ID:</strong> ${data.nationalId}</p>
        <p style="margin:8px 0;color:#374151;"><strong>Location:</strong> ${data.location}</p>
        ${data.salaryRange ? `<p style="margin:8px 0;color:#374151;"><strong>Salary Range:</strong> ${data.salaryRange}</p>` : ''}
        ${data.phoneNumber ? `<p style="margin:8px 0;color:#374151;"><strong>Phone:</strong> ${data.phoneNumber}</p>` : ''}
      </div>
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}

export function renderHousekeeperRegistrationEmail(
  data: HousekeeperRegistrationEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Platform Admin';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = `New Housekeeper Registration - ${data.housekeeperName}`;
  const body = `
      <h2 style="margin-bottom:16px;font-size:24px;font-weight:600;color:#1f2937;">🏠 New Housekeeper Registration</h2>
      <p style="color:#6b7280;font-size:16px;line-height:1.6;">A new housekeeper has registered on the platform.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="margin:8px 0;color:#374151;"><strong>Name:</strong> ${data.housekeeperName}</p>
        <p style="margin:8px 0;color:#374151;"><strong>ID Number:</strong> ${data.idNumber}</p>
        <p style="margin:8px 0;color:#374151;"><strong>Phone:</strong> ${data.phoneNumber}</p>
        ${data.email ? `<p style="margin:8px 0;color:#374151;"><strong>Email:</strong> ${data.email}</p>` : ''}
        <p style="margin:8px 0;color:#374151;"><strong>Location:</strong> ${data.location}</p>
        ${data.workDistrict ? `<p style="margin:8px 0;color:#374151;"><strong>Preferred Work District:</strong> ${data.workDistrict}</p>` : ''}
        ${data.workSector ? `<p style="margin:8px 0;color:#374151;"><strong>Preferred Work Sector:</strong> ${data.workSector}</p>` : ''}
        ${data.experience ? `<p style="margin:8px 0;color:#374151;"><strong>Experience:</strong> ${data.experience}</p>` : ''}
      </div>
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}

export function renderAdminContactMessageEmail(
  data: AdminContactMessageEmailData,
): { html: string; subject: string } {
  const platformName = data.platformName || 'Support Team';
  const accentColor = resolveAccentColor(data.accentColor);
  const subject = data.subject;
  const body = `
      <h2>📩 New Contact Message Received</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <div>${data.message}</div>
    `;
  return { subject, html: wrapEmail({ subject, bodyContent: body, platformName, accentColor, logoUrl: resolveLogoUrl(data.logo) }) };
}
