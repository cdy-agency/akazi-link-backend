import {
  AnyEmailTemplate,
  EmailTemplate,
  LegacyEmailTemplate,
  RenderedEmail,
  SendEmailParams,
} from './email.types';
import { EMAIL_PLATFORM } from './email.constants';
import { renderOtpEmail } from './templates/otp.template';
import { renderWelcomeEmail } from './templates/welcome.template';
import { renderPasswordResetEmail } from './templates/password-reset.template';
import { renderCvProcessedEmail } from './templates/cv-processed.template';
import { renderApplicationReceivedEmail } from './templates/application-received.template';
import {
  renderInterviewCancelledEmail,
  renderInterviewScheduledEmail,
  renderInterviewUpdatedEmail,
} from './templates/interview-scheduled.template';
import { renderOfferSentEmail } from './templates/offer-sent.template';
import {
  renderAccountApprovedEmail,
  renderAccountRejectedEmail,
} from './templates/account-approved.template';
import { renderAdminCandidateRegistrationEmail } from './templates/admin-candidate-registration.template';
import {
  renderAdminCompanyProfileCompletedEmail,
  renderAdminCompanyRegistrationEmail,
  renderAdminContactMessageEmail,
  renderEmployerRegistrationEmail,
  renderGenericMessageEmail,
  renderHiredNotificationEmail,
  renderHousekeeperRegistrationEmail,
  renderOfferResponseEmail,
} from './templates/legacy-support.template';

function resolveDisplayName(template: AnyEmailTemplate, data: Record<string, unknown>): string {
  const candidates = [
    data.platformName,
    data.companyName,
    data.companyDisplayName,
    data.employeeName,
    data.accountName,
    data.name,
    data.userName,
    data.contactName,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  if (
    template === EmailTemplate.OTP ||
    template === EmailTemplate.WELCOME ||
    template === EmailTemplate.CV_PROCESSED
  ) {
    return EMAIL_PLATFORM.name;
  }

  return EMAIL_PLATFORM.supportTeam;
}

export function renderEmail(params: SendEmailParams): RenderedEmail {
  const { template, data } = params;
  const payload = data as Record<string, unknown>;

  let rendered: { html: string; subject: string };

  switch (template) {
    case EmailTemplate.OTP:
      rendered = renderOtpEmail(data as never);
      break;
    case EmailTemplate.WELCOME:
      rendered = renderWelcomeEmail(data as never);
      break;
    case EmailTemplate.PASSWORD_RESET:
      rendered = renderPasswordResetEmail(data as never);
      break;
    case EmailTemplate.CV_PROCESSED:
      rendered = renderCvProcessedEmail(data as never);
      break;
    case EmailTemplate.APPLICATION_RECEIVED:
      rendered = renderApplicationReceivedEmail(data as never);
      break;
    case EmailTemplate.INTERVIEW_SCHEDULED:
      rendered = renderInterviewScheduledEmail(data as never);
      break;
    case EmailTemplate.INTERVIEW_UPDATED:
      rendered = renderInterviewUpdatedEmail(data as never);
      break;
    case EmailTemplate.INTERVIEW_CANCELLED:
      rendered = renderInterviewCancelledEmail(data as never);
      break;
    case EmailTemplate.OFFER_SENT:
      rendered = renderOfferSentEmail(data as never);
      break;
    case EmailTemplate.ACCOUNT_APPROVED:
      rendered = renderAccountApprovedEmail(data as never);
      break;
    case EmailTemplate.ACCOUNT_REJECTED:
      rendered = renderAccountRejectedEmail(data as never);
      break;
    case LegacyEmailTemplate.ADMIN_CANDIDATE_REGISTRATION:
      rendered = renderAdminCandidateRegistrationEmail(data as never);
      break;
    case LegacyEmailTemplate.ADMIN_COMPANY_REGISTRATION:
      rendered = renderAdminCompanyRegistrationEmail(data as never);
      break;
    case LegacyEmailTemplate.ADMIN_COMPANY_PROFILE_COMPLETED:
      rendered = renderAdminCompanyProfileCompletedEmail(data as never);
      break;
    case LegacyEmailTemplate.GENERIC_MESSAGE:
      rendered = renderGenericMessageEmail(data as never);
      break;
    case LegacyEmailTemplate.HIRED_NOTIFICATION:
      rendered = renderHiredNotificationEmail(data as never);
      break;
    case LegacyEmailTemplate.OFFER_RESPONSE:
      rendered = renderOfferResponseEmail(data as never);
      break;
    case LegacyEmailTemplate.EMPLOYER_REGISTRATION:
      rendered = renderEmployerRegistrationEmail(data as never);
      break;
    case LegacyEmailTemplate.HOUSEKEEPER_REGISTRATION:
      rendered = renderHousekeeperRegistrationEmail(data as never);
      break;
    case LegacyEmailTemplate.ADMIN_CONTACT_MESSAGE:
      rendered = renderAdminContactMessageEmail(data as never);
      break;
    default: {
      const exhaustive: never = template;
      throw new Error(`Unsupported email template: ${exhaustive}`);
    }
  }

  return {
    html: rendered.html,
    subject: rendered.subject,
    displayName: resolveDisplayName(template, payload),
  };
}
