export interface SendEmailJob {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
}
