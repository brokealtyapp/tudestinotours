import type { Reservation, Tour, User, Passenger } from "@shared/schema";
import nodemailer from "nodemailer";

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private smtpConfigured: boolean = false;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM || "noreply@tudestino.tours";
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: parseInt(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        });
        this.smtpConfigured = true;
        console.log("[SMTP] Servicio SMTP inicializado correctamente");
      } catch (error) {
        console.error("[SMTP] Error inicializando transportador SMTP:", error);
        this.smtpConfigured = false;
      }
    } else {
      console.log("[SMTP] Credenciales SMTP no configuradas - emails en modo simulado");
      this.smtpConfigured = false;
    }
  }

  private async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.smtpConfigured || !this.transporter) {
      console.log(`[EMAIL SIMULADO] Para: ${data.to}`);
      console.log(`[EMAIL SIMULADO] Asunto: ${data.subject}`);
      console.log(`[EMAIL SIMULADO] Contenido: ${data.html.substring(0, 200)}...`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      
      console.log(`[SMTP] Email enviado exitosamente a ${data.to}`);
      return true;
    } catch (error) {
      console.error(`[SMTP] Error enviando email a ${data.to}:`, error);
      return false;
    }
  }

  async sendReservationConfirmation(
    user: User,
    reservation: Reservation,
    tour: Tour,
    passengers: Passenger[],
    generatedPassword?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .credentials { background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #2563eb; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Reserva Recibida!</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${user.name},</p>
            <p>Hemos recibido tu reserva para el tour <strong>${tour.title}</strong>. Tu número de reserva es: <span class="highlight">${reservation.id}</span></p>
            
            ${generatedPassword ? `
              <div class="credentials">
                <h3>🔐 Credenciales de Acceso</h3>
                <p>Hemos creado una cuenta para ti. Puedes acceder a tu portal de cliente con las siguientes credenciales:</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Contraseña:</strong> <span class="highlight">${generatedPassword}</span></p>
                <p style="font-size: 12px; color: #666;"><em>Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</em></p>
              </div>
            ` : ''}
            
            <div class="details">
              <h3>Detalles de la Reserva</h3>
              <p><strong>Tour:</strong> ${tour.title}</p>
              <p><strong>Destino:</strong> ${tour.location}</p>
              <p><strong>Fecha de salida:</strong> ${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</p>
              <p><strong>Número de pasajeros:</strong> ${reservation.numberOfPassengers}</p>
              <p><strong>Precio total:</strong> $${reservation.totalPrice}</p>
              <p><strong>Fecha límite de pago:</strong> ${reservation.paymentDueDate ? new Date(reservation.paymentDueDate).toLocaleDateString('es-ES') : 'Por definir'}</p>
            </div>

            <div class="details">
              <h3>Pasajeros</h3>
              <ul>
                ${passengers.map(p => `<li>${p.fullName} - Pasaporte: ${p.passportNumber}</li>`).join('')}
              </ul>
            </div>

            <p>Nuestro equipo revisará tu reserva en las próximas 24-48 horas. Te enviaremos un correo con el enlace de pago una vez aprobada.</p>
            
            <p><strong>Importante:</strong> Debes completar el pago antes del ${reservation.paymentDueDate ? new Date(reservation.paymentDueDate).toLocaleDateString('es-ES') : 'la fecha límite'} para confirmar tu reserva.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Reserva Recibida - ${tour.title} - Ref: ${reservation.id}`,
      html,
    });
  }

  async sendPaymentReminder(
    user: User,
    reservation: Reservation,
    tour: Tour,
    daysRemaining: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #dc2626; font-weight: bold; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recordatorio de Pago</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${user.name},</p>
            
            <div class="warning">
              <p><strong>⏰ Faltan ${daysRemaining} días para la fecha límite de pago</strong></p>
              <p>Fecha límite: <span class="highlight">${reservation.paymentDueDate ? new Date(reservation.paymentDueDate).toLocaleDateString('es-ES') : 'Por definir'}</span></p>
            </div>

            <p>Te recordamos que tu reserva para <strong>${tour.title}</strong> está pendiente de pago.</p>
            
            <div class="details">
              <h3>Detalles de tu Reserva</h3>
              <p><strong>Número de reserva:</strong> ${reservation.id}</p>
              <p><strong>Tour:</strong> ${tour.title}</p>
              <p><strong>Fecha de salida:</strong> ${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</p>
              <p><strong>Monto total:</strong> $${reservation.totalPrice}</p>
            </div>

            ${reservation.paymentLink ? `
              <div style="text-align: center;">
                <a href="${reservation.paymentLink}" class="button">Realizar Pago Ahora</a>
              </div>
            ` : `
              <p>En breve recibirás el enlace de pago. Si no lo has recibido, por favor contáctanos.</p>
            `}

            <p><strong>⚠️ Importante:</strong> Si no completamos el pago antes de la fecha límite, tu reserva será cancelada automáticamente y los cupos serán liberados.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `⏰ Recordatorio de Pago - Faltan ${daysRemaining} días - ${tour.title}`,
      html,
    });
  }

  async sendCancellationNotice(
    user: User,
    reservation: Reservation,
    tour: Tour,
    reason: "vencida" | "cancelada"
  ): Promise<boolean> {
    const reasonText = reason === "vencida" 
      ? "ha sido marcada como vencida por falta de pago" 
      : "ha sido cancelada automáticamente";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #991b1b; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .alert { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reserva ${reason === "vencida" ? "Vencida" : "Cancelada"}</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${user.name},</p>
            
            <div class="alert">
              <p><strong>Tu reserva ${reasonText}</strong></p>
            </div>

            <p>Lamentamos informarte que tu reserva para <strong>${tour.title}</strong> ya no está activa.</p>
            
            <div class="details">
              <h3>Detalles de la Reserva Cancelada</h3>
              <p><strong>Número de reserva:</strong> ${reservation.id}</p>
              <p><strong>Tour:</strong> ${tour.title}</p>
              <p><strong>Fecha de salida:</strong> ${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</p>
              <p><strong>Fecha límite de pago:</strong> ${reservation.paymentDueDate ? new Date(reservation.paymentDueDate).toLocaleDateString('es-ES') : 'No definida'}</p>
            </div>

            <p>Los cupos reservados han sido liberados y están nuevamente disponibles.</p>
            
            <p>Si deseas realizar una nueva reserva para este u otro tour, visita nuestra plataforma.</p>

            <p>Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Reserva ${reason === "vencida" ? "Vencida" : "Cancelada"} - ${tour.title}`,
      html,
    });
  }

  async sendItinerary(
    user: User,
    reservation: Reservation,
    tour: Tour,
    passengers: Passenger[]
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .success { background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #059669; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Pago Confirmado - Itinerario de Viaje</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${user.name},</p>
            
            <div class="success">
              <p><strong>✓ Tu pago ha sido confirmado exitosamente</strong></p>
              <p>Reserva confirmada para: <span class="highlight">${tour.title}</span></p>
            </div>

            <div class="details">
              <h3>Información del Viaje</h3>
              <p><strong>Número de confirmación:</strong> ${reservation.id}</p>
              <p><strong>Tour:</strong> ${tour.title}</p>
              <p><strong>Destino:</strong> ${tour.location}</p>
              <p><strong>Fecha de salida:</strong> ${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</p>
              <p><strong>Duración:</strong> ${tour.duration}</p>
              <p><strong>Número de pasajeros:</strong> ${reservation.numberOfPassengers}</p>
            </div>

            <div class="details">
              <h3>Lista de Pasajeros</h3>
              <ul>
                ${passengers.map(p => `
                  <li>
                    <strong>${p.fullName}</strong><br>
                    Pasaporte: ${p.passportNumber}<br>
                    Nacionalidad: ${p.nationality}
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="details">
              <h3>Descripción del Tour</h3>
              <p>${tour.description}</p>
            </div>

            <p><strong>Próximos pasos:</strong></p>
            <ul>
              <li>Guarda este correo como comprobante de tu reserva</li>
              <li>Te contactaremos 7 días antes de la salida con información adicional</li>
              <li>Asegúrate de que todos tus documentos estén vigentes</li>
            </ul>

            <p>¡Estamos emocionados de que te unas a esta aventura!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `✓ Confirmado - Itinerario de ${tour.title}`,
      html,
    });
  }

  async sendDocumentRejectionNotification(
    buyer: { email: string; name: string },
    reservation: Reservation,
    passenger: Passenger,
    tour: Tour | undefined,
    rejectionReason: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .warning { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #dc2626; font-weight: bold; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Acción Requerida: Documento Rechazado</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${buyer.name},</p>
            
            <div class="warning">
              <p><strong>⚠️ Necesitamos que vuelvas a subir un documento de pasaporte</strong></p>
            </div>

            <p>Hemos revisado el documento de pasaporte del pasajero <strong>${passenger.fullName}</strong> y lamentablemente no cumple con los requisitos necesarios.</p>
            
            <div class="details">
              <h3>Razón del Rechazo</h3>
              <p>${rejectionReason}</p>
            </div>

            <div class="details">
              <h3>Detalles de la Reserva</h3>
              <p><strong>Número de reserva:</strong> ${reservation.id}</p>
              ${tour ? `<p><strong>Tour:</strong> ${tour.title}</p>` : ''}
              <p><strong>Pasajero:</strong> ${passenger.fullName}</p>
              <p><strong>Pasaporte:</strong> ${passenger.passportNumber}</p>
            </div>

            <div class="details">
              <h3>Requisitos del Documento</h3>
              <ul>
                <li>La foto debe ser clara y legible</li>
                <li>Todos los datos del pasaporte deben ser visibles</li>
                <li>El documento debe estar vigente</li>
                <li>Formato aceptado: JPG, PNG o PDF</li>
                <li>Tamaño máximo: 10MB</li>
              </ul>
            </div>

            <p><strong>Próximos pasos:</strong></p>
            <ol>
              <li>Toma una nueva foto del pasaporte asegurándote de que cumpla con los requisitos</li>
              <li>Inicia sesión en tu panel de reservas</li>
              <li>Sube el nuevo documento</li>
            </ol>

            <p>Por favor, sube el documento correcto lo antes posible para que podamos procesar tu reserva.</p>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: buyer.email,
      subject: `⚠️ Acción Requerida - Documento Rechazado - Reserva ${reservation.id}`,
      html,
    });
  }

  // NEW: Notificar admin cuando se crea una reserva
  async sendAdminNewReservation(
    adminEmail: string,
    reservation: Reservation,
    tour: Tour,
    buyer: { name: string; email: string }
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .notification { background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #2563eb; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Nueva Reserva Recibida</h1>
          </div>
          <div class="content">
            <div class="notification">
              <p><strong>Se ha registrado una nueva reserva en el sistema</strong></p>
              <p>ID: <span class="highlight">${reservation.id}</span></p>
            </div>

            <div class="details">
              <h3>Información del Cliente</h3>
              <p><strong>Nombre:</strong> ${buyer.name}</p>
              <p><strong>Email:</strong> ${buyer.email}</p>
              <p><strong>Teléfono:</strong> ${reservation.buyerPhone}</p>
            </div>

            <div class="details">
              <h3>Detalles de la Reserva</h3>
              <p><strong>Tour:</strong> ${tour.title}</p>
              <p><strong>Destino:</strong> ${tour.location}</p>
              <p><strong>Fecha de salida:</strong> ${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</p>
              <p><strong>Pasajeros:</strong> ${reservation.numberOfPassengers}</p>
              <p><strong>Monto total:</strong> $${reservation.totalPrice}</p>
              <p><strong>Estado de pago:</strong> ${reservation.paymentStatus === 'pending' ? 'Pendiente' : 'Confirmado'}</p>
              <p><strong>Fecha límite de pago:</strong> ${reservation.paymentDueDate ? new Date(reservation.paymentDueDate).toLocaleDateString('es-ES') : 'No definida'}</p>
            </div>

            <p>Revisa el panel de administración para más detalles y gestionar esta reserva.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours - Sistema de Administración</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `🎯 Nueva Reserva - ${tour.title} - ${buyer.name}`,
      html,
    });
  }

  // NEW: Notificar admin cuando se suben documentos
  async sendAdminDocumentUploaded(
    adminEmail: string,
    reservation: Reservation,
    tour: Tour | undefined,
    passenger: { fullName: string; passportNumber: string },
    buyer: { name: string; email: string }
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .notification { background-color: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #8b5cf6; font-weight: bold; }
          .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Documento Subido para Revisión</h1>
          </div>
          <div class="content">
            <div class="notification">
              <p><strong>Un cliente ha subido un documento de pasaporte</strong></p>
              <p>Requiere tu revisión y aprobación</p>
            </div>

            <div class="details">
              <h3>Información del Pasajero</h3>
              <p><strong>Nombre:</strong> ${passenger.fullName}</p>
              <p><strong>Pasaporte:</strong> ${passenger.passportNumber}</p>
            </div>

            <div class="details">
              <h3>Información de la Reserva</h3>
              <p><strong>ID Reserva:</strong> ${reservation.id}</p>
              ${tour ? `<p><strong>Tour:</strong> ${tour.title}</p>` : ''}
              <p><strong>Cliente:</strong> ${buyer.name} (${buyer.email})</p>
              <p><strong>Fecha de salida:</strong> ${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</p>
            </div>

            <p><strong>Acción requerida:</strong> Revisa el documento en la sección "Documentos" del panel de administración y apruébalo o recházalo con comentarios.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours - Sistema de Administración</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `📄 Documento Pendiente - ${passenger.fullName} - Reserva ${reservation.id}`,
      html,
    });
  }

  // NEW: Alerta a admin de reserva próxima a vencer
  async sendAdminReservationExpiring(
    adminEmail: string,
    reservation: Reservation,
    tour: Tour,
    daysRemaining: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta: Reserva Próxima a Vencer</h1>
          </div>
          <div class="content">
            <div class="warning">
              <p><strong>Una reserva vencerá en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''}</strong></p>
              <p>Fecha límite: <span class="highlight">${reservation.paymentDueDate ? new Date(reservation.paymentDueDate).toLocaleDateString('es-ES') : 'No definida'}</span></p>
            </div>

            <div class="details">
              <h3>Información de la Reserva</h3>
              <p><strong>ID:</strong> ${reservation.id}</p>
              <p><strong>Cliente:</strong> ${reservation.buyerName} (${reservation.buyerEmail})</p>
              <p><strong>Tour:</strong> ${tour.title}</p>
              <p><strong>Monto:</strong> $${reservation.totalPrice}</p>
              <p><strong>Estado de pago:</strong> ${reservation.paymentStatus === 'pending' ? 'Pendiente' : reservation.paymentStatus}</p>
            </div>

            <p><strong>Recomendación:</strong> Contacta al cliente para confirmar el pago o extender la fecha límite si es necesario.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours - Sistema de Administración</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `⚠️ Alerta: Reserva ${reservation.id} vence en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''}`,
      html,
    });
  }

  // NEW: Notificar cliente cuando documento es aprobado
  async sendDocumentApproval(
    buyer: { email: string; name: string },
    reservation: Reservation,
    passenger: Passenger,
    tour: Tour | undefined
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .success { background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #059669; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Documento Aprobado</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${buyer.name},</p>
            
            <div class="success">
              <p><strong>✓ El documento de pasaporte ha sido aprobado exitosamente</strong></p>
            </div>

            <p>Hemos revisado y aprobado el documento de pasaporte del pasajero <strong>${passenger.fullName}</strong>.</p>
            
            <div class="details">
              <h3>Detalles</h3>
              <p><strong>Pasajero:</strong> ${passenger.fullName}</p>
              <p><strong>Número de pasaporte:</strong> ${passenger.passportNumber}</p>
              <p><strong>Reserva:</strong> ${reservation.id}</p>
              ${tour ? `<p><strong>Tour:</strong> ${tour.title}</p>` : ''}
            </div>

            <p>Tu reserva está ahora un paso más cerca de estar completamente confirmada. Asegúrate de completar el pago antes de la fecha límite para garantizar tu lugar.</p>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: buyer.email,
      subject: `✓ Documento Aprobado - ${passenger.fullName} - Reserva ${reservation.id}`,
      html,
    });
  }

  // NEW: Enviar credenciales cuando admin crea usuario
  async sendWelcomeCredentials(
    user: User,
    generatedPassword: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .credentials { background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #2563eb; font-weight: bold; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Tu Destino Tours!</h1>
          </div>
          <div class="content">
            <p>Hola ${user.name},</p>
            
            <p>Hemos creado una cuenta para ti en nuestra plataforma. Ahora puedes acceder a tu portal de cliente para gestionar tus reservas, ver itinerarios, y más.</p>

            <div class="credentials">
              <h3>🔐 Tus Credenciales de Acceso</h3>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Contraseña temporal:</strong> <span class="highlight">${generatedPassword}</span></p>
              <p style="font-size: 12px; color: #666; margin-top: 10px;"><em>⚠️ Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</em></p>
            </div>

            <div class="details">
              <h3>Qué puedes hacer en tu portal:</h3>
              <ul>
                <li>Ver todas tus reservas</li>
                <li>Consultar los detalles de tus viajes</li>
                <li>Descargar itinerarios y facturas</li>
                <li>Ver el estado de tus pagos</li>
                <li>Subir documentos de viaje</li>
              </ul>
            </div>

            <p>Si tienes alguna pregunta sobre tu cuenta o nuestros servicios, no dudes en contactarnos.</p>

            <p>¡Esperamos verte pronto en uno de nuestros increíbles tours!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `🎉 Bienvenido a Tu Destino Tours - Credenciales de Acceso`,
      html,
    });
  }

  // NEW: Recordatorio de viaje próximo
  async sendTripReminder(
    user: User,
    reservation: Reservation,
    tour: Tour,
    daysUntilTrip: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .reminder { background-color: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 15px 0; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .checklist { background-color: #fef3c7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #8b5cf6; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 ¡Tu Viaje se Acerca!</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${user.name},</p>
            
            <div class="reminder">
              <p><strong>Faltan ${daysUntilTrip} día${daysUntilTrip > 1 ? 's' : ''} para tu viaje</strong></p>
              <p>Fecha de salida: <span class="highlight">${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</span></p>
            </div>

            <p>Nos emociona que tu aventura a <strong>${tour.location}</strong> esté cada vez más cerca. Queremos asegurarnos de que estés completamente preparado.</p>

            <div class="details">
              <h3>Detalles de tu Viaje</h3>
              <p><strong>Tour:</strong> ${tour.title}</p>
              <p><strong>Destino:</strong> ${tour.location}</p>
              <p><strong>Fecha de salida:</strong> ${new Date(reservation.departureDate).toLocaleDateString('es-ES')}</p>
              <p><strong>Número de pasajeros:</strong> ${reservation.numberOfPassengers}</p>
              <p><strong>Número de confirmación:</strong> ${reservation.id}</p>
            </div>

            <div class="checklist">
              <h3>✅ Lista de Verificación Pre-Viaje</h3>
              <ul>
                <li>Verifica que tu pasaporte esté vigente</li>
                <li>Revisa las recomendaciones de equipaje</li>
                <li>Confirma tu punto de encuentro o recogida</li>
                <li>Revisa el itinerario completo</li>
                <li>Guarda una copia de tu confirmación de reserva</li>
                <li>Verifica los requisitos de visado si aplican</li>
              </ul>
            </div>

            <p>Puedes descargar tu itinerario completo desde tu panel de cliente.</p>

            <p>Si tienes alguna pregunta o necesitas información adicional, estamos aquí para ayudarte.</p>

            <p><strong>¡Que tengas un viaje increíble!</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Tu Destino Tours. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `🌍 Recordatorio: Tu viaje a ${tour.location} es en ${daysUntilTrip} día${daysUntilTrip > 1 ? 's' : ''}`,
      html,
    });
  }
}

export const emailService = new EmailService();
