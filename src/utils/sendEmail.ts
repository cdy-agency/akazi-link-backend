// sendEmail.ts
import { MailerUtil, MailPayload } from './mailer.util';
import { EmailTemplates } from './email-templetes';
import {
  AdminNotifyOptions,
  BaseEmailOptions,
  CompanyApprovalOptions,
  CompanyRegistrationOptions,
  ContactReplyOptions,
  EmployeeRegistrationOptions,
  JobApplicationOptions,
  JobOfferOptions,
  ResetPasswordOptions,
  WelcomeOptions,
  CompanyProfileCompletedOptions,
  OfferResponseOptions,
  HiredNotificationOptions

} from '../types/email';

type SendEmailOptions =
  | CompanyRegistrationOptions
  | EmployeeRegistrationOptions
  | CompanyApprovalOptions
  | JobApplicationOptions
  | JobOfferOptions
  | AdminNotifyOptions
  | ContactReplyOptions
  | ResetPasswordOptions
  | WelcomeOptions
  | CompanyProfileCompletedOptions
  | OfferResponseOptions
  | HiredNotificationOptions

export async function sendEmail(options: SendEmailOptions) {
  let html: string;
  let subject: string;
  const { type, to, replyTo, cc, bcc, attachments, data } = options;

  // common defaults
  const defaultLogo = (data as any).logo || '';
  const defaultCompanyName =
    // prefer companyName if it exists
    (data as any).companyName ||
    // fallbacks
    (data as any).employeeName ||
    (data as any).userName ||
    (data as any).platformName ||
    'Platform Team';

  const defaultAccentColor = (data as any).accentColor || '#3b82f6';

  switch (type) {
    case 'companyRegistration':
      html = EmailTemplates.companyRegistrationNotify({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = `New Company Registration - ${(data as any).companyName}`;
      break;

    case 'employeeRegistration':
      html = EmailTemplates.employeeRegistrationNotify({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = `New Employee Registration - ${(data as any).employeeName}`;
      break;

    case 'companyApproval':
      html = EmailTemplates.companyApprovalStatus({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = `Company Application ${data.status} - ${(data as any).companyName}`;
      break;

    case 'jobApplication':
      html = EmailTemplates.jobApplicationNotify({
        ...data || '',
        logoUrl: defaultLogo || '',
        companyName: defaultCompanyName || '',
        accentColor: defaultAccentColor || '',
      });
      subject = `New Application: ${(data as any).jobTitle} - ${(data as any).applicantName}`;
      break;

    case 'jobOffer':
      html = EmailTemplates.jobOfferNotify({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = `Job Offer: ${(data as any).jobTitle} at ${(data as any).companyName}`;
      break;

    case 'offerResponse': {
      html = EmailTemplates.offerResponseNotify({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      } as any);
      const actionText = (data as any).action === 'accepted' ? 'Accepted' : 'Rejected';
      subject = `Offer ${actionText}: ${(data as any).jobTitle} - ${(data as any).employeeName}`;
      break;
    }

    case 'hiredNotification': {
      html = EmailTemplates.hiredNotification({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      } as any);
      subject = `Congratulations! You've Been Hired - ${(data as any).jobTitle}`;
      break;
    }

    case 'adminNotify':
      html = EmailTemplates.adminNotify({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = data.subject;
      break;

    case 'contactReply':
      html = EmailTemplates.contactReply({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = data.subject;
      break;

    case 'resetPassword':
      html = EmailTemplates.resetPassword({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = data.subject;
      break;

    case 'welcome':
      html = EmailTemplates.welcome({
        ...data,
        logoUrl: defaultLogo,
        companyName: defaultCompanyName,
        accentColor: defaultAccentColor,
      });
      subject = data.subject;
      break;

    case 'companyProfileCompletedNotify': {
  const { companyName, dashboardLink, logo, accentColor } = data as any;

  html = EmailTemplates.companyProfileCompletedNotify({
    companyName,
    dashboardLink,
    logoUrl: logo || defaultLogo,
    accentColor: accentColor || defaultAccentColor,
    adminName: defaultCompanyName,
  });

  subject = `Company Profile Completed - ${companyName}`;
  break;
}

    default:
      throw new Error('Invalid email type');
  }

  const payload: MailPayload = {
    to,
    subject,
    html,
    companyName: defaultCompanyName,
    ...(replyTo && { replyTo }),
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    ...(attachments && { attachments }),
  };

  return MailerUtil.sendMail(payload);
}
