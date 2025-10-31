import type { Reservation, Tour, User, Passenger } from "@shared/schema";

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private resendApiKey: string | undefined;
  private fromEmail: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || "noreply@tudestino.tours";
  }

  private async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.resendApiKey) {
      console.log(`[EMAIL SIMULADO] Para: ${data.to}`);
      console.log(`[EMAIL SIMULADO] Asunto: ${data.subject}`);
      console.log(`[EMAIL SIMULADO] Contenido: ${data.html.substring(0, 200)}...`);
      return true;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: data.to,
          subject: data.subject,
          html: data.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Error enviando email a ${data.to}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error enviando email a ${data.to}:`, error);
      return false;
    }
  }

  async sendReservationConfirmation(
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
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
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
}

export const emailService = new EmailService();
