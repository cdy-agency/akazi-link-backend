export type BaseEmailOptions = {
  to: string | string[];
  replyTo?: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
};

// Company Registration Notification Options
export type CompanyRegistrationOptions = BaseEmailOptions & {
  type: 'companyRegistration';
  data: {
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
};

// Employee Registration Notification Options
export type EmployeeRegistrationOptions = BaseEmailOptions & {
  type: 'employeeRegistration';
  data: {
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
};

// Company Approval Status Options
export type CompanyApprovalOptions = BaseEmailOptions & {
  type: 'companyApproval';
  data: {
    companyName: string;
    status: 'approved' | 'rejected' | 'pending';
    message?: string;
    dashboardLink?: string;
    logo?: string;
    platformName?: string;
    accentColor?: string;
  };
};

// Job Application Notification Options
export type JobApplicationOptions = BaseEmailOptions & {
  type: 'jobApplication';
  data: {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  jobId: string;
};
};

// Job Offer Notification Options
export type JobOfferOptions = BaseEmailOptions & {
  type: 'jobOffer';
  data: {
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
    companyLogoUrl?: string;
    logo?: string;
    platformName?: string;
    accentColor?: string;
  };
};

// Original email types
export type AdminNotifyOptions = BaseEmailOptions & {
  type: 'adminNotify';
  data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    logo?: string;
    companyName?: string;
    accentColor?: string;
  };
};

export type ContactReplyOptions = BaseEmailOptions & {
  type: 'contactReply';
  data: {
    contactName: string;
    subject: string;
    content: string;
    logo?: string;
    companyName?: string;
    accentColor?: string;
  };
};

export type ResetPasswordOptions = BaseEmailOptions & {
  type: 'resetPassword';
  data: {
    userName: string;
    subject: string;
    resetLink: string;
    logo?: string;
    companyName?: string;
    accentColor?: string;
  };
};

export type WelcomeOptions = BaseEmailOptions & {
  type: 'welcome';
  data: {
    userName: string;
    subject: string;
    logo?: string;
    companyName?: string;
    accentColor?: string;
  };
};

export interface CompanyProfileCompletedOptions {
  type: 'companyProfileCompletedNotify';
  to: string;
  data: {
    companyName: string;
    dashboardLink: string;
    logo?: string;
    accentColor?: string;
  };
  replyTo?: string;
  cc?: string;
  bcc?: string;
  attachments?: any[];
}