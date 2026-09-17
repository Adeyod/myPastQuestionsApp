import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { SendEmailJob } from './interface/mail.interface';

export interface BulkRecipient {
  email: string;
  first_name: string;
}

@Injectable()
export class MailService {
  constructor(@InjectQueue('mail') private mailQueue: Queue<SendEmailJob>) {}
  private app_name = 'Past Question App';

  private async sendMail(data: SendEmailJob) {
    console.log('🚀 Adding email job...', data);

    await this.mailQueue.add('send_email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    console.log('✅ Job added');

    return { message: `Email job added to queue for ${data.to}` };
  }

  async sendVerificationEmail(to: string, first_name: string, token: string) {
    return await this.sendMail({
      to,
      subject: 'Verify your email',
      templateName: 'verify-email.ejs',
      templateData: { first_name, token, app_name: this.app_name },
    });
  }

  async sendPasswordReset(to: string, first_name: string, token: string) {
    return this.sendMail({
      to,
      subject: 'Password Reset',
      templateName: 'password-reset.ejs',
      templateData: { first_name, token, app_name: this.app_name },
    });
  }

  async sendBulkEmails(
    recipients: BulkRecipient[],
    subject: string,
    additionalTemplateData: Record<string, any> = {},
  ) {
    if (!recipients || recipients.length === 0) {
      return { message: 'No recipients provided.' };
    }

    const defaultJobOpts = {
      attempts: 3,
      backoff: { type: 'exponential' as const, delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    };

    // Format jobs for Bull's addBulk API
    const jobs = recipients.map((recipient) => ({
      name: 'send_email',
      data: {
        to: recipient.email,
        subject,
        templateName: 'plan-activation-email.ejs',
        templateData: {
          ...additionalTemplateData,
          first_name: recipient.first_name,
          app_name: this.app_name,
        },
      },
      opts: defaultJobOpts,
    }));

    console.log(`Adding ${jobs.length} bulk email jobs...`);
    await this.mailQueue.addBulk(jobs);
    console.log('Bulk jobs added');

    return {
      message: `Bulk email jobs queued successfully for ${recipients.length} users.`,
    };
  }
}
