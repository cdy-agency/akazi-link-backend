export class EmailTemplates {
  private static APP_LOGO = process.env.APP_LOGO_URL;
  private static APP_NAME = process.env.APP_NAME || "My Platform";


  private static normalizeLogoUrl(originalUrl: string): string {
    if (!originalUrl || originalUrl.trim() === '') {
      return '';
    }

    try {
      let transformed = originalUrl.replace(
        /\/upload\//i,
        '/upload/f_png,q_auto,c_fill,g_auto,w_96,h_96,r_max/',
      );

      transformed = transformed.replace(/\.svg(\?.*)?$/i, '.png$1');

      return transformed;
    } catch {
      return originalUrl;
    }
  }

  private static wrap(
    subject: string,
    companyName: string,
    accentColor: string,
    logoUrl: string,
    bodyContent: string,
  ): string {
    return `
       <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
        <style>
          body { font-family: "Google Sans",Roboto,RobotoDraft,Helvetica,Arial,sans-serif; margin:0; padding:0; background:#f1f5f9; font-size:16px; }
          .container { max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.1); }
          .content { padding:30px 40px; font-size:16px; line-height:1.6; }
        </style>
      </head>
      <body>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
          <tr>
            <td align="center">
              <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0">
                ${this.header(companyName, accentColor, logoUrl)}
                <tr><td class="content">${bodyContent}</td></tr>
                ${this.footer(companyName)}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
  }

  private static header(
    companyName: string,
    accentColor: string,
    logoUrl: string,
  ): string {
    const normalizedLogoUrl = this.normalizeLogoUrl(this.APP_LOGO || "");
    const appName = this.APP_NAME

    return `
<tr>
  <td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e5e7eb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;padding-right:12px;">
                
              </td>
              <td style="vertical-align:middle;">
                <div style="color:#1f2937;font-size:22px;font-weight:700;line-height:1.2;margin:0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">
                  ${appName}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
`;
  }

   private static footer(companyName: string): string {
    return `
      <tr>
        <td style="background:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.
        </td>
      </tr>
    `;
  }

  // Admin notification template
  static adminNotify({...args}) {
    const { name, email, subject, message, logoUrl, companyName = 'Support Team', accentColor = '#3b82f6' } = args;
    const body = `
      <h2>📩 New Contact Message Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <div>${message}</div>
    `;
    return this.wrap(subject, companyName, accentColor, logoUrl, body);
  }

  // User reply template
  static contactReply({
    contactName,
    subject,
    content,
    logoUrl,
    companyName = 'Support Team',
    accentColor = '#3b82f6',
  }: {
    contactName: string;
    subject: string;
    logoUrl: string;
    content: string;
    companyName?: string;
    accentColor?: string;
  }): string {
    const body = `
      <p style="margin-bottom:24px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:#3c4043;font-size:16px;">Hello ${contactName},</p>
      <div style="font-size:16px;line-height:1.6;color:#3c4043;margin:24px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">
        ${content}
      </div>
    `;
    return this.wrap(subject, companyName, accentColor, logoUrl, body);
  }

  // Reset Password Email Template
  static resetPassword({
    userName,
    subject,
    resetLink,
    logoUrl,
    companyName = 'Support Team',
    accentColor = '#3b82f6',
  }: {
    userName: string;
    subject: string;
    resetLink: string;
    logoUrl: string;
    companyName?: string;
    accentColor?: string;
  }): string {
    const body = `
      <p style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;color:#1f2937;">Dear ${userName},</p>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">We received a request to reset your password. Click the button below to proceed:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#9ca3af;font-size:14px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;line-height:1.5;">If you did not request this, you can safely ignore this email.</p>
    `;
    return this.wrap(subject, companyName, accentColor, logoUrl, body);
  }

  // Welcome Email Template
  static welcome({
    userName,
    subject,
    logoUrl,
    companyName = 'Support Team',
    accentColor = '#3b82f6',
  }: {
    userName: string;
    subject: string;
    logoUrl: string;
    companyName?: string;
    accentColor?: string;
  }): string {
    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:26px;font-weight:600;color:#1f2937;">Welcome aboard, ${userName} 🎉</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;line-height:1.6;margin:20px 0;">We're excited to have you at <strong>${companyName}</strong>. Get started by exploring your dashboard and setting up your profile.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://yourapp.com/dashboard" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;display:inline-block;">
          Go to Dashboard
        </a>
      </div>
    `;
    return this.wrap(subject, companyName, accentColor, logoUrl, body);
  }

  // NEW TEMPLATES FOR YOUR REQUIREMENTS

  // 1. Company Registration Notification to Admin
  static companyRegistrationNotify({
    companyName: registeredCompanyName,
    email,
    location,
    website,
    phoneNumber,
    description,
    logoUrl,
    companyName = 'Platform Admin',
    accentColor = '#3b82f6',
  }: {
    companyName: string;
    email: string;
    location?: string;
    website?: string;
    phoneNumber?: string;
    description?: string;
    logoUrl: string;
    accentColor?: string;
  }): string {
    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">🏢 New Company Registration</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">A new company has registered on the platform and is awaiting approval.</p>
      
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Company Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Company Name:</strong> ${registeredCompanyName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Email:</strong> ${email}</p>
        ${location ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Location:</strong> ${location}</p>` : ''}
        ${website ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Website:</strong> <a href="${website}" style="color:${accentColor};">${website}</a></p>` : ''}
        ${phoneNumber ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Phone:</strong> ${phoneNumber}</p>` : ''}
        ${description ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Description:</strong></p><div style="color:#374151;font-size:16px;line-height:1.6;margin-top:8px;">${description}</div>` : ''}
      </div>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="https://admin.yourapp.com/companies/pending" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;margin-right:12px;">
          Review Company
        </a>
      </div>
    `;
    return this.wrap('New Company Registration - ' + registeredCompanyName, companyName, accentColor, logoUrl, body);
  }

  // 2. Employee Registration Notification
  static employeeRegistrationNotify({
    employeeName,
    email,
    position,
    experience,
    skills,
    phoneNumber,
    linkedinProfile,
    logoUrl,
    companyName = 'Platform Admin',
    accentColor = '#3b82f6',
  }: {
    employeeName: string;
    email: string;
    position?: string;
    experience?: string;
    skills?: string[];
    phoneNumber?: string;
    linkedinProfile?: string;
    logoUrl: string;
    companyName?: string;
    accentColor?: string;
  }): string {
    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">👤 New Employee Registration</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">A new job seeker has registered on the platform.</p>
      
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Employee Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Name:</strong> ${employeeName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Email:</strong> ${email}</p>
        ${position ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Position:</strong> ${position}</p>` : ''}
        ${experience ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Experience:</strong> ${experience}</p>` : ''}
        ${phoneNumber ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Phone:</strong> ${phoneNumber}</p>` : ''}
        ${linkedinProfile ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>LinkedIn:</strong> <a href="${linkedinProfile}" style="color:${accentColor};">${linkedinProfile}</a></p>` : ''}
        ${skills && skills.length > 0 ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Skills:</strong> ${skills.join(', ')}</p>` : ''}
      </div>
    `;
    return this.wrap('New Employee Registration - ' + employeeName, companyName, accentColor, logoUrl, body);
  }

  // 3. Company Approval/Rejection Notification
  static companyApprovalStatus({
    companyName: registeredCompanyName,
    status,
    message,
    dashboardLink,
    logoUrl,
    companyName = 'Platform Team',
    accentColor = '#3b82f6',
  }: {
    companyName: string;
    status: 'approved' | 'rejected' | 'pending';
    message?: string;
    dashboardLink?: string;
    logoUrl: string;
    accentColor?: string;
  }): string {
    const isApproved = status === 'approved';
    const isPending = status === 'pending';
    const statusColor = isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';
    const statusIcon = isApproved ? '✅' : isPending ? '⏳' : '❌';
    const statusText = isApproved ? 'Approved' : isPending ? 'Under Review' : 'Rejected';

    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">${statusIcon} Company Application ${statusText}</h2>
      <p style="margin-bottom:24px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:#3c4043;font-size:16px;">Dear ${companyName},</p>
      
      <div style="background:#f9fafb;border-left:4px solid ${statusColor};border-radius:8px;padding:24px;margin:24px 0;">
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;margin:0 0 12px 0;color:#1f2937;font-weight:600;">
          Your company registration for <strong>${registeredCompanyName}</strong> has been ${statusText.toLowerCase()}.
        </p>
        ${message ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;margin:0;">${message}</p>` : ''}
      </div>
      
      ${isApproved && dashboardLink ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          Access Your Dashboard
        </a>
      </div>
      ` : ''}
      
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        ${isApproved ? 'Welcome to our platform! You can now start posting jobs and managing your company profile.' : 
          isPending ? 'We are currently reviewing your application and will get back to you soon.' :
          'If you have any questions about this decision, please don\'t hesitate to contact our support team.'}
      </p>
    `;
    return this.wrap(`Company Application ${statusText} - ${registeredCompanyName}`, companyName, accentColor, logoUrl, body);
  }

  // 4. Job Application Notification to Company
  static jobApplicationNotify({
    applicantName,
    applicantEmail,
    jobTitle,
    jobId,
    experience,
    skills,
    coverLetter,
    resumeLink,
    applicantProfileLink,
    logoUrl,
    companyName,
    accentColor = '#3b82f6',
  }: {
    applicantName: string;
    applicantEmail: string;
    jobTitle: string;
    jobId: string;
    experience?: string;
    skills?: string[];
    coverLetter?: string;
    resumeLink?: string;
    applicantProfileLink?: string;
    logoUrl: string;
    companyName: string;
    accentColor?: string;
  }): string {
    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">📋 New Job Application Received</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">You have received a new application for the position: <strong>${jobTitle}</strong></p>
      
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Applicant Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Name:</strong> ${applicantName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Email:</strong> ${applicantEmail}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Position Applied:</strong> ${jobTitle}</p>
        ${experience ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Experience:</strong> ${experience}</p>` : ''}
        ${skills && skills.length > 0 ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Skills:</strong> ${skills.join(', ')}</p>` : ''}
        
        ${coverLetter ? `
        <div style="margin-top:16px;">
          <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Cover Letter:</strong></p>
          <div style="background:#ffffff;border:1px solid #d1d5db;border-radius:6px;padding:16px;margin-top:8px;font-size:16px;line-height:1.6;color:#374151;">
            ${coverLetter}
          </div>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align:center;margin:32px 0;">
        ${applicantProfileLink ? `
        <a href="${applicantProfileLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;margin-right:12px;">
          View Profile
        </a>
        ` : ''}
        ${resumeLink ? `
        <a href="${resumeLink}" style="background:#6b7280;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
          Download Resume
        </a>
        ` : ''}
      </div>
    `;
    return this.wrap(`New Application: ${jobTitle} - ${applicantName}`, companyName, accentColor, logoUrl, body);
  }

  // 5. Job Offer Notification to Employee
  static jobOfferNotify({
    employeeName,
    companyName: offeringCompanyName,
    jobTitle,
    salary,
    startDate,
    location,
    jobDescription,
    benefits,
    offerExpiryDate,
    acceptOfferLink,
    companyLogoUrl,
    logoUrl,
    companyName = 'Platform Team',
    accentColor = '#3b82f6',
  }: {
    employeeName: string;
    jobTitle: string;
    salary?: string;
    startDate?: string;
    location?: string;
    jobDescription?: string;
    benefits?: string[];
    offerExpiryDate?: string;
    acceptOfferLink?: string;
    companyLogoUrl?: string;
    logoUrl: string;
    companyName?: string;
    accentColor?: string;
  }): string {
    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">🎉 Congratulations! Job Offer Received</h2>
      <p style="margin-bottom:24px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:#3c4043;font-size:16px;">Dear ${employeeName},</p>
      
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        Great news! <strong>${offeringCompanyName}</strong> would like to offer you the position of <strong>${jobTitle}</strong>.
      </p>
      
      <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Offer Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Company:</strong> ${offeringCompanyName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Position:</strong> ${jobTitle}</p>
        ${salary ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Salary:</strong> ${salary}</p>` : ''}
        ${location ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Location:</strong> ${location}</p>` : ''}
        ${startDate ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Start Date:</strong> ${startDate}</p>` : ''}
        ${offerExpiryDate ? `<p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#ef4444;"><strong>Offer Expires:</strong> ${offerExpiryDate}</p>` : ''}
        
        ${jobDescription ? `
        <div style="margin-top:16px;">
          <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Job Description:</strong></p>
          <div style="color:#374151;font-size:16px;line-height:1.6;margin-top:8px;">${jobDescription}</div>
        </div>
        ` : ''}
        
        ${benefits && benefits.length > 0 ? `
        <div style="margin-top:16px;">
          <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Benefits:</strong></p>
          <ul style="color:#374151;font-size:16px;line-height:1.6;margin:8px 0;padding-left:20px;">
            ${benefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      
      ${acceptOfferLink ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${acceptOfferLink}" style="background:#10b981;color:#fff;padding:16px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;display:inline-block;margin-right:12px;">
          Accept Offer
        </a>
        <a href="${acceptOfferLink.replace('/accept', '/decline')}" style="background:#6b7280;color:#fff;padding:16px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;display:inline-block;">
          Decline Offer
        </a>
      </div>
      ` : ''}
      
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        Please review the offer details carefully. If you have any questions, feel free to contact the company directly or reach out to our support team.
      </p>
    `;
    return this.wrap(`Job Offer: ${jobTitle} at ${offeringCompanyName}`, companyName, accentColor, logoUrl, body);
  }

  // 6. Offer Response Notification to Company
  static offerResponseNotify({
    companyDisplayName,
    employeeName,
    jobTitle,
    action,
    message,
    viewRequestLink,
    logoUrl,
    brandName = 'Recruitment Team',
    accentColor = '#3b82f6',
  }: {
    companyDisplayName: string;
    employeeName: string;
    jobTitle: string;
    action: 'accepted' | 'rejected';
    message?: string;
    viewRequestLink?: string;
    logoUrl: string;
    brandName?: string;
    accentColor?: string;
  }): string {
    const isAccepted = action === 'accepted';
    const statusColor = isAccepted ? '#10b981' : '#ef4444';
    const statusText = isAccepted ? 'accepted' : 'rejected';

    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">Offer ${isAccepted ? 'Accepted' : 'Rejected'}</h2>
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        ${employeeName} has <strong style="color:${statusColor}">${statusText}</strong> your offer for <strong>${jobTitle}</strong>.
      </p>
      ${message ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">${message}</div>` : ''}
      ${viewRequestLink ? `
      <div style="text-align:center;margin:24px 0;">
        <a href="${viewRequestLink}" style="background:${accentColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;display:inline-block;">View Request</a>
      </div>
      ` : ''}
    `;

    return this.wrap(`Offer ${isAccepted ? 'Accepted' : 'Rejected'} - ${employeeName}`, brandName, accentColor, logoUrl, body);
  }

  // 7. Hired Notification to Employee
  static hiredNotification({
    employeeName,
    companyName: hiringCompanyName,
    jobTitle,
    customMessage,
    logoUrl,
    brandName = 'Recruitment Team',
    accentColor = '#3b82f6',
  }: {
    employeeName: string;
    companyName: string;
    jobTitle: string;
    customMessage?: string;
    logoUrl: string;
    brandName?: string;
    accentColor?: string;
  }): string {
    const body = `
      <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">🎉 Congratulations! You've Been Hired!</h2>
      <p style="margin-bottom:24px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;color:#3c4043;font-size:16px;">Dear ${employeeName},</p>
      
      <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:#1f2937;">Job Details</h3>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Company:</strong> ${hiringCompanyName}</p>
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;margin:8px 0;color:#374151;"><strong>Position:</strong> ${jobTitle}</p>
      </div>
      
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:24px 0;">
        <p style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;margin:0;">
          ${customMessage || `Congratulations! You have been hired for <strong>${jobTitle}</strong> at <strong>${hiringCompanyName}</strong>. Our team will reach out with next steps.`}
        </p>
      </div>
      
      <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        We're excited to have you join our team! If you have any questions, please don't hesitate to contact us.
      </p>
    `;

    return this.wrap(`Congratulations! You've Been Hired - ${jobTitle}`, brandName, accentColor, logoUrl, body);
  }

  
  static companyProfileCompletedNotify({
  companyName: completedCompanyName,
  dashboardLink,
  logoUrl,
  adminName = 'Platform Admin',
  accentColor = '#3b82f6',
}: {
  companyName: string;
  dashboardLink: string; 
  logoUrl: string;
  adminName?: string;
  accentColor?: string;
}): string {
  const body = `
    <h2 style="margin-bottom:16px;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#1f2937;">🏢 Company Profile Completed</h2>
    <p style="color:#6b7280;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
      The company <strong>${completedCompanyName}</strong> has completed its profile and is ready for review.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${dashboardLink}" style="background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;font-size:16px;display:inline-block;">
        View in Dashboard
      </a>
    </div>
  `;
  return this.wrap(`Company Profile Completed - ${completedCompanyName}`, adminName, accentColor, logoUrl, body);
}
}