export enum EmailTemplate {
  OTP = 'OTP',
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CV_PROCESSED = 'CV_PROCESSED',
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_UPDATED = 'INTERVIEW_UPDATED',
  INTERVIEW_CANCELLED = 'INTERVIEW_CANCELLED',
  OFFER_SENT = 'OFFER_SENT',
  ACCOUNT_APPROVED = 'ACCOUNT_APPROVED',
  ACCOUNT_REJECTED = 'ACCOUNT_REJECTED',
  PROVIDER_REGISTRATION_SUBMITTED = 'PROVIDER_REGISTRATION_SUBMITTED',
  PROVIDER_REGISTRATION_APPROVED = 'PROVIDER_REGISTRATION_APPROVED',
  PROVIDER_REGISTRATION_REJECTED = 'PROVIDER_REGISTRATION_REJECTED',
  SERVICE_REQUEST_SUBMITTED = 'SERVICE_REQUEST_SUBMITTED',
  SERVICE_REQUEST_ACCEPTED = 'SERVICE_REQUEST_ACCEPTED',
  SERVICE_REQUEST_REJECTED = 'SERVICE_REQUEST_REJECTED',
  SERVICE_REQUEST_COMPLETED = 'SERVICE_REQUEST_COMPLETED',
  SERVICE_REQUEST_NEW = 'SERVICE_REQUEST_NEW',
  SERVICE_REQUEST_ADMIN_NEW = 'SERVICE_REQUEST_ADMIN_NEW',
  ADVERTISEMENT_REQUEST_ADMIN = 'ADVERTISEMENT_REQUEST_ADMIN',
  ADVERTISEMENT_REQUEST_SUBMITTED = 'ADVERTISEMENT_REQUEST_SUBMITTED',
}

/** Legacy flows preserved during platform cleanup — same HTML as pre-refactor */
export enum LegacyEmailTemplate {
  ADMIN_CANDIDATE_REGISTRATION = 'ADMIN_CANDIDATE_REGISTRATION',
  ADMIN_COMPANY_REGISTRATION = 'ADMIN_COMPANY_REGISTRATION',
  ADMIN_COMPANY_PROFILE_COMPLETED = 'ADMIN_COMPANY_PROFILE_COMPLETED',
  GENERIC_MESSAGE = 'GENERIC_MESSAGE',
  HIRED_NOTIFICATION = 'HIRED_NOTIFICATION',
  OFFER_RESPONSE = 'OFFER_RESPONSE',
  EMPLOYER_REGISTRATION = 'EMPLOYER_REGISTRATION',
  HOUSEKEEPER_REGISTRATION = 'HOUSEKEEPER_REGISTRATION',
  ADMIN_CONTACT_MESSAGE = 'ADMIN_CONTACT_MESSAGE',
}

export type AnyEmailTemplate = EmailTemplate | LegacyEmailTemplate;

export type EmailAttachment = {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
};

export type BaseSendEmailParams = {
  to: string | string[];
  replyTo?: string;
  cc?: string;
  bcc?: string;
  attachments?: EmailAttachment[];
};

export type OtpEmailData = {
  name?: string;
  otp: string;
  expirationMinutes: number;
  platformName?: string;
  accentColor?: string;
  logo?: string;
};

export type WelcomeEmailData = {
  name: string;
  subject?: string;
  dashboardUrl?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type PasswordResetEmailData = {
  name: string;
  subject?: string;
  resetLink: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type CvProcessedEmailData = {
  name: string;
  dashboardUrl?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type ApplicationReceivedEmailData = {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobId: string;
  experience?: string;
  skills?: string[];
  coverLetter?: string;
  resumeLink?: string;
  applicantProfileLink?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type InterviewScheduledEmailData = {
  name: string;
  jobTitle: string;
  scheduledAt: string;
  interviewType?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  dashboardUrl?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type InterviewUpdatedEmailData = InterviewScheduledEmailData;

export type InterviewCancelledEmailData = {
  name: string;
  jobTitle: string;
  scheduledAt?: string;
  reason?: string;
  dashboardUrl?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type OfferSentEmailData = {
  employeeName: string;
  companyName: string;
  jobTitle: string;
  salary?: string;
  startDate?: string;
  location?: string;
  jobDescription?: string;
  benefits?: string[];
  offerExpiryDate?: string;
  acceptOfferLink?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type AccountApprovedEmailData = {
  accountName: string;
  companyName?: string;
  message?: string;
  dashboardLink?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type AccountRejectedEmailData = {
  accountName: string;
  companyName?: string;
  message?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type AdminCandidateRegistrationEmailData = {
  employeeName: string;
  email: string;
  position?: string;
  experience?: string;
  skills?: string[];
  phoneNumber?: string;
  linkedinProfile?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type AdminCompanyRegistrationEmailData = {
  companyName: string;
  email: string;
  location?: string;
  website?: string;
  phoneNumber?: string;
  description?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type AdminCompanyProfileCompletedEmailData = {
  companyName: string;
  dashboardLink: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type GenericMessageEmailData = {
  contactName: string;
  subject: string;
  content: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type HiredNotificationEmailData = {
  employeeName: string;
  companyName: string;
  jobTitle: string;
  customMessage?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type OfferResponseEmailData = {
  companyDisplayName: string;
  employeeName: string;
  jobTitle: string;
  action: 'accepted' | 'rejected';
  message?: string;
  viewRequestLink?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type EmployerRegistrationEmailData = {
  employerName: string;
  email: string;
  nationalId: string;
  location: string;
  salaryRange?: string;
  phoneNumber?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type HousekeeperRegistrationEmailData = {
  housekeeperName: string;
  idNumber: string;
  phoneNumber: string;
  location: string;
  workDistrict?: string;
  workSector?: string;
  email?: string;
  experience?: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type AdminContactMessageEmailData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  logo?: string;
  platformName?: string;
  accentColor?: string;
};

export type ProviderRegistrationSubmittedEmailData = {
  name: string;
  providerType: 'COMPANY' | 'INDIVIDUAL';
  email: string;
  temporaryPassword: string;
  loginUrl?: string;
  dashboardUrl?: string;
  platformName?: string;
  accentColor?: string;
  logo?: string;
};

export type ProviderRegistrationApprovedEmailData = {
  name: string;
  email?: string;
  loginUrl?: string;
  dashboardUrl?: string;
  platformName?: string;
  accentColor?: string;
  logo?: string;
};

export type ProviderRegistrationRejectedEmailData = {
  name: string;
  reason?: string;
  platformName?: string;
  logo?: string;
};

export type ServiceRequestSubmittedEmailData = {
  customerName: string;
  providerName: string;
  serviceName: string;
  platformName?: string;
  logo?: string;
};

export type ServiceRequestCustomerStatusEmailData = {
  customerName: string;
  providerName: string;
  serviceName: string;
  status?: string;
  note?: string;
  platformName?: string;
  logo?: string;
};

export type ServiceRequestNewEmailData = {
  providerName: string;
  customerName: string;
  serviceName: string;
  requestId?: string;
  platformName?: string;
  logo?: string;
};

export type ServiceRequestAdminNewEmailData = {
  customerName: string;
  providerName: string;
  serviceName: string;
  platformName?: string;
  logo?: string;
};

export type AdvertisementRequestPlacementInfo = {
  label: string;
  recommendedSize: string;
};

export type AdvertisementRequestAdminEmailData = {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  message: string;
  placements: AdvertisementRequestPlacementInfo[];
  platformName?: string;
  accentColor?: string;
  logo?: string;
};

export type AdvertisementRequestSubmittedEmailData = {
  name: string;
  placements: AdvertisementRequestPlacementInfo[];
  homeUrl?: string;
  platformName?: string;
  accentColor?: string;
  logo?: string;
};

export type EmailTemplateDataMap = {
  [EmailTemplate.OTP]: OtpEmailData;
  [EmailTemplate.WELCOME]: WelcomeEmailData;
  [EmailTemplate.PASSWORD_RESET]: PasswordResetEmailData;
  [EmailTemplate.CV_PROCESSED]: CvProcessedEmailData;
  [EmailTemplate.APPLICATION_RECEIVED]: ApplicationReceivedEmailData;
  [EmailTemplate.INTERVIEW_SCHEDULED]: InterviewScheduledEmailData;
  [EmailTemplate.INTERVIEW_UPDATED]: InterviewUpdatedEmailData;
  [EmailTemplate.INTERVIEW_CANCELLED]: InterviewCancelledEmailData;
  [EmailTemplate.OFFER_SENT]: OfferSentEmailData;
  [EmailTemplate.ACCOUNT_APPROVED]: AccountApprovedEmailData;
  [EmailTemplate.ACCOUNT_REJECTED]: AccountRejectedEmailData;
  [EmailTemplate.PROVIDER_REGISTRATION_SUBMITTED]: ProviderRegistrationSubmittedEmailData;
  [EmailTemplate.PROVIDER_REGISTRATION_APPROVED]: ProviderRegistrationApprovedEmailData;
  [EmailTemplate.PROVIDER_REGISTRATION_REJECTED]: ProviderRegistrationRejectedEmailData;
  [EmailTemplate.SERVICE_REQUEST_SUBMITTED]: ServiceRequestSubmittedEmailData;
  [EmailTemplate.SERVICE_REQUEST_ACCEPTED]: ServiceRequestCustomerStatusEmailData;
  [EmailTemplate.SERVICE_REQUEST_REJECTED]: ServiceRequestCustomerStatusEmailData;
  [EmailTemplate.SERVICE_REQUEST_COMPLETED]: ServiceRequestCustomerStatusEmailData;
  [EmailTemplate.SERVICE_REQUEST_NEW]: ServiceRequestNewEmailData;
  [EmailTemplate.SERVICE_REQUEST_ADMIN_NEW]: ServiceRequestAdminNewEmailData;
  [EmailTemplate.ADVERTISEMENT_REQUEST_ADMIN]: AdvertisementRequestAdminEmailData;
  [EmailTemplate.ADVERTISEMENT_REQUEST_SUBMITTED]: AdvertisementRequestSubmittedEmailData;
};

export type LegacyEmailTemplateDataMap = {
  [LegacyEmailTemplate.ADMIN_CANDIDATE_REGISTRATION]: AdminCandidateRegistrationEmailData;
  [LegacyEmailTemplate.ADMIN_COMPANY_REGISTRATION]: AdminCompanyRegistrationEmailData;
  [LegacyEmailTemplate.ADMIN_COMPANY_PROFILE_COMPLETED]: AdminCompanyProfileCompletedEmailData;
  [LegacyEmailTemplate.GENERIC_MESSAGE]: GenericMessageEmailData;
  [LegacyEmailTemplate.HIRED_NOTIFICATION]: HiredNotificationEmailData;
  [LegacyEmailTemplate.OFFER_RESPONSE]: OfferResponseEmailData;
  [LegacyEmailTemplate.EMPLOYER_REGISTRATION]: EmployerRegistrationEmailData;
  [LegacyEmailTemplate.HOUSEKEEPER_REGISTRATION]: HousekeeperRegistrationEmailData;
  [LegacyEmailTemplate.ADMIN_CONTACT_MESSAGE]: AdminContactMessageEmailData;
};

export type SendEmailParams<T extends AnyEmailTemplate = AnyEmailTemplate> =
  BaseSendEmailParams & {
    template: T;
    data: T extends EmailTemplate
      ? EmailTemplateDataMap[T]
      : T extends LegacyEmailTemplate
        ? LegacyEmailTemplateDataMap[T]
        : never;
  };

export type RenderedEmail = {
  html: string;
  subject: string;
  displayName: string;
};
