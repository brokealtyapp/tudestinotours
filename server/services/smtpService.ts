import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { storage } from '../storage';
import type { InsertEmailLog } from '@shared/schema';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  reservationId?: string;
  templateType?: string;
}

class SMTPService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !port || !user || !pass) {
      console.warn('[SMTP] Credenciales SMTP no configuradas. Los emails no se enviarán.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: parseInt(port) === 465,
        auth: {
          user,
          pass,
        },
      });

      this.isConfigured = true;
      console.log('[SMTP] Servicio SMTP inicializado correctamente');
    } catch (error) {
      console.error('[SMTP] Error inicializando transporter:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('[SMTP] No se puede enviar email: servicio no configurado');
      
      // Registrar intento fallido
      await this.logEmail({
        recipientEmail: options.to,
        subject: options.subject,
        body: options.html,
        status: 'failed',
        errorMessage: 'SMTP no configurado',
        templateType: options.templateType || 'unknown',
        reservationId: options.reservationId,
      });
      
      return false;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log('[SMTP] Email enviado:', info.messageId);

      // Registrar envío exitoso
      await this.logEmail({
        recipientEmail: options.to,
        subject: options.subject,
        body: options.html,
        status: 'sent',
        templateType: options.templateType || 'unknown',
        reservationId: options.reservationId,
      });

      return true;
    } catch (error: any) {
      console.error('[SMTP] Error enviando email:', error);

      // Registrar error
      await this.logEmail({
        recipientEmail: options.to,
        subject: options.subject,
        body: options.html,
        status: 'failed',
        errorMessage: error.message,
        templateType: options.templateType || 'unknown',
        reservationId: options.reservationId,
      });

      return false;
    }
  }

  async sendTemplateEmail(
    to: string,
    templateType: string,
    variables: Record<string, string>,
    reservationId?: string
  ): Promise<boolean> {
    try {
      // Obtener plantilla de la base de datos
      const template = await storage.getEmailTemplateByType(templateType);
      
      if (!template || !template.isActive) {
        console.warn(`[SMTP] Plantilla "${templateType}" no encontrada o inactiva`);
        return false;
      }

      // Renderizar plantilla
      let subject = template.subject;
      let body = template.body;

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      }

      // Enviar email
      return await this.sendEmail({
        to,
        subject,
        html: body,
        reservationId,
        templateType,
      });
    } catch (error) {
      console.error('[SMTP] Error enviando email con plantilla:', error);
      return false;
    }
  }

  private async logEmail(logData: InsertEmailLog): Promise<void> {
    try {
      await storage.createEmailLog(logData);
    } catch (error) {
      console.error('[SMTP] Error registrando email log:', error);
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('[SMTP] Conexión verificada exitosamente');
      return true;
    } catch (error) {
      console.error('[SMTP] Error verificando conexión:', error);
      return false;
    }
  }
}

export const smtpService = new SMTPService();
