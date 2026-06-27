/**
 * @deprecated Use `emailService` from `services/email/email.service` instead.
 * Thin adapter preserving legacy `sendEmail({ type, to, data })` call sites.
 */
import { emailService } from '../services/email/email.service';
import {
  EmailTemplate,
  LegacyEmailTemplate,
} from '../services/email/email.types';
import type {
  AdminNotifyOptions,
  CompanyApprovalOptions,
  CompanyProfileCompletedOptions,
  CompanyRegistrationOptions,
  ContactReplyOptions,
  EmailVerificationOtpOptions,
  EmployeeRegistrationOptions,
  EmployerRegistrationOptions,
  HiredNotificationOptions,
  HousekeeperRegistrationOptions,
  JobApplicationOptions,
  JobOfferOptions,
  OfferResponseOptions,
  ResetPasswordOptions,
  WelcomeOptions,
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
  | EmployerRegistrationOptions
  | HousekeeperRegistrationOptions
  | EmailVerificationOtpOptions;

export async function sendEmail(options: SendEmailOptions) {
  const { type, to, replyTo, cc, bcc, attachments, data } = options;

  switch (type) {
    case 'emailVerificationOtp':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: EmailTemplate.OTP,
        data: {
          otp: data.code,
          expirationMinutes: data.expirationMinutes,
          platformName: data.platformName,
          accentColor: data.accentColor,
          logo: data.logo,
        },
      });

    case 'employeeRegistration':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.ADMIN_CANDIDATE_REGISTRATION,
        data: {
          employeeName: data.employeeName,
          email: data.email,
          position: data.position,
          experience: data.experience,
          skills: data.skills,
          phoneNumber: data.phoneNumber,
          linkedinProfile: data.linkedinProfile,
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    case 'companyRegistration':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.ADMIN_COMPANY_REGISTRATION,
        data: {
          companyName: data.companyName,
          email: data.email,
          location: [data.province, data.district].filter(Boolean).join(', ') || undefined,
          website: data.website,
          phoneNumber: data.phoneNumber,
          description: data.description,
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    case 'companyApproval':
      if (data.status === 'approved') {
        return emailService.send({
          to,
          replyTo,
          cc,
          bcc,
          attachments,
          template: EmailTemplate.ACCOUNT_APPROVED,
          data: {
            accountName: data.companyName,
            companyName: data.companyName,
            message: data.message,
            dashboardLink: data.dashboardLink,
            logo: data.logo,
            platformName: data.platformName,
            accentColor: data.accentColor,
          },
        });
      }

      if (data.status === 'rejected') {
        return emailService.send({
          to,
          replyTo,
          cc,
          bcc,
          attachments,
          template: EmailTemplate.ACCOUNT_REJECTED,
          data: {
            accountName: data.companyName,
            companyName: data.companyName,
            message: data.message,
            logo: data.logo,
            platformName: data.platformName,
            accentColor: data.accentColor,
          },
        });
      }

      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: EmailTemplate.ACCOUNT_APPROVED,
        data: {
          accountName: data.companyName,
          companyName: data.companyName,
          message:
            data.message ||
            'Your company application is under review. We will notify you once a decision is made.',
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    case 'jobApplication':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: EmailTemplate.APPLICATION_RECEIVED,
        data: {
          applicantName: data.applicantName,
          applicantEmail: data.applicantEmail,
          jobTitle: data.jobTitle,
          jobId: data.jobId,
          experience: data.experience,
          skills: data.skills,
          coverLetter: data.coverLetter,
          resumeLink: data.resumeLink,
          applicantProfileLink: data.applicantProfileLink,
        },
      });

    case 'jobOffer':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: EmailTemplate.OFFER_SENT,
        data: {
          employeeName: data.employeeName,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          salary: data.salary,
          startDate: data.startDate,
          location: data.location,
          jobDescription: data.jobDescription,
          benefits: data.benefits,
          offerExpiryDate: data.offerExpiryDate,
          acceptOfferLink: data.acceptOfferLink,
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    case 'offerResponse':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.OFFER_RESPONSE,
        data: {
          companyDisplayName: data.companyDisplayName,
          employeeName: data.employeeName,
          jobTitle: data.jobTitle,
          action: data.action,
          message: data.message,
          viewRequestLink: data.viewRequestLink,
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    case 'hiredNotification':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.HIRED_NOTIFICATION,
        data: {
          employeeName: data.employeeName,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          customMessage: data.customMessage,
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    case 'adminNotify':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.ADMIN_CONTACT_MESSAGE,
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          logo: data.logo,
          platformName: data.companyName,
          accentColor: data.accentColor,
        },
      });

    case 'contactReply':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.GENERIC_MESSAGE,
        data: {
          contactName: data.contactName,
          subject: data.subject,
          content: data.content,
          logo: data.logo,
          platformName: data.companyName,
          accentColor: data.accentColor,
        },
      });

    case 'resetPassword':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: EmailTemplate.PASSWORD_RESET,
        data: {
          name: data.userName,
          subject: data.subject,
          resetLink: data.resetLink,
          logo: data.logo,
          platformName: data.companyName,
          accentColor: data.accentColor,
        },
      });

    case 'welcome':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: EmailTemplate.WELCOME,
        data: {
          name: data.userName,
          subject: data.subject,
          logo: data.logo,
          platformName: data.companyName,
          accentColor: data.accentColor,
        },
      });

    case 'companyProfileCompletedNotify':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.ADMIN_COMPANY_PROFILE_COMPLETED,
        data: {
          companyName: data.companyName,
          dashboardLink: data.dashboardLink,
          logo: data.logo,
          accentColor: data.accentColor,
        },
      });

    case 'employerRegistration':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.EMPLOYER_REGISTRATION,
        data: {
          employerName: data.employerName,
          email: data.email || 'No email provided',
          nationalId: data.nationalId,
          location: data.location,
          salaryRange: data.salaryRange,
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    case 'housekeeperRegistration':
      return emailService.send({
        to,
        replyTo,
        cc,
        bcc,
        attachments,
        template: LegacyEmailTemplate.HOUSEKEEPER_REGISTRATION,
        data: {
          housekeeperName: data.housekeeperName,
          idNumber: data.idNumber,
          phoneNumber: data.phoneNumber,
          location: data.location,
          logo: data.logo,
          platformName: data.platformName,
          accentColor: data.accentColor,
        },
      });

    default:
      throw new Error('Invalid email type');
  }
}

// Re-export for gradual migration
export { emailService } from '../services/email/email.service';
export { EmailTemplate, LegacyEmailTemplate } from '../services/email/email.types';
