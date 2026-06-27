import { MailerUtil } from '../../utils/mailer.util';
import { renderEmail } from './email.renderer';
import type { SendEmailParams } from './email.types';

export class EmailService {
  async send<T extends SendEmailParams>(params: T) {
    const { to, replyTo, cc, bcc, attachments, template, data } = params;
    const { html, subject, displayName } = renderEmail({
      template,
      data,
    } as SendEmailParams);

    return MailerUtil.sendMail({
      to,
      subject,
      html,
      companyName: displayName,
      ...(replyTo && { replyTo }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(attachments && { attachments }),
    });
  }
}

export const emailService = new EmailService();
