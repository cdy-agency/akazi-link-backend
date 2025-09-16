import * as nodemailer from 'nodemailer';

export type MailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  companyName: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
};

export class MailerUtil {
  private static sanitizeDisplayName(name?: string): string | undefined {
    if (!name) return undefined;

    const cleaned = name.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
    return cleaned || undefined;
  }

  private static extractEmailAddress(emailString: string): string {
    const match = emailString.match(/<([^>]+)>$/);
    return match ? match[1] : emailString;
  }

  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Boolean(process.env.SMTP_SECURE === 'true'),
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  static async sendMail(payload: MailPayload & { companyName?: string }) {
    const defaultFrom = process.env.MAIL_FROM ?? 'no-reply@example.com';

    // Extract clean email address
    const emailAddress = this.extractEmailAddress(payload.from ?? defaultFrom);

    // Sanitize display name
    const safeDisplay = this.sanitizeDisplayName(payload.companyName);

    // Format the from field properly
    const fromField = safeDisplay
      ? `"${safeDisplay}" <${emailAddress}>`
      : emailAddress;

    const mail = {
      ...payload,
      from: fromField,
      ...(payload.replyTo && { replyTo: payload.replyTo }),
      ...(payload.cc && { cc: payload.cc }),
      ...(payload.bcc && { bcc: payload.bcc }),
      ...(payload.attachments && { attachments: payload.attachments }),
    };

    try {
      const result = await this.transporter.sendMail(mail);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // Method to verify SMTP connection
  static async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  // Method to send bulk emails (useful for notifications)
  static async sendBulkMail(
    recipients: string[],
    payload: Omit<MailPayload, 'to'> & { companyName?: string }
  ) {
    const promises = recipients.map(recipient =>
      this.sendMail({ ...payload, to: recipient })
    );

    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Bulk email results: ${successful} successful, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      console.error('Bulk email sending failed:', error);
      throw error;
    }
  }
}