import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bull';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer';
import { join } from 'path';
import { Resend } from 'resend';
import { SendEmailJob } from './interface/mail.interface';

@Processor('mail')
export class MailProcessor {
  private transporter?: nodemailer.Transporter;
  private resend?: Resend;
  private templateCache = new Map<string, string>();
  private isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction =
      this.configService.getOrThrow<string>('NODE_ENV') === 'production';

    if (this.isProduction) {
      this.resend = new Resend(
        this.configService.getOrThrow<string>('RESEND_API_KEY'),
      );
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('SMTP_HOST'),
        port: this.configService.getOrThrow<number>('SMTP_PORT'),
        secure: this.configService.getOrThrow<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.getOrThrow<string>('SMTP_USER'),
          pass: this.configService.getOrThrow<string>('SMTP_PASS'),
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  // private getTemplate(templateName: string): string {
  //   let template = this.templateCache.get(templateName);

  //   if (!template) {
  //     const filePath = join(
  //       process.cwd(),
  //       'dist',
  //       'src',
  //       'templates',
  //       templateName,
  //     );

  //     template = fs.readFileSync(filePath, 'utf-8');
  //     this.templateCache.set(templateName, template);
  //   }

  //   return template;
  // }

  private getTemplate(templateName: string): string {
    let template = this.templateCache.get(templateName);

    if (!template) {
      const filePath = join(__dirname, '..', 'templates', templateName);

      template = fs.readFileSync(filePath, 'utf-8');
      this.templateCache.set(templateName, template);
    }

    return template;
  }

  @Process({ name: 'send_email', concurrency: 5 })
  async handleSendEmail(job: Job<SendEmailJob>) {
    try {
      const { to, subject, templateData, templateName } = job.data;

      const template = this.getTemplate(templateName);
      const html = ejs.render(template, templateData);

      if (this.isProduction && this.resend) {
        const response = await this.resend.emails.send({
          from: this.configService.getOrThrow<string>('RESEND_FROM'),
          to,
          subject,
          html,
        });
      } else if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: `<${this.configService.get<string>('SMTP_FROM')}>`,
          to,
          subject,
          html,
        });

        console.log('Email response:', info);
      }

      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
}
