import { db } from "../db";
import { emailTemplates } from "../../shared/schema";

const templates = [
  {
    templateType: "reservation_confirmation",
    subject: "¡Reserva Confirmada! - {{tourName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Tu aventura comienza aquí</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">¡Reserva Confirmada!</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>{{buyerName}}</strong>,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                ¡Gracias por confiar en nosotros! Tu reserva ha sido confirmada exitosamente.
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Detalles de tu Reserva</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Tour:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{tourName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Fecha de Salida:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{departureDate}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Pasajeros:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{numberOfPassengers}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Total:</strong></td>
                    <td style="padding: 8px 0; color: #1e40af; font-size: 16px; font-weight: bold;">\${{totalPrice}}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Puedes ver todos los detalles de tu reserva y gestionar tus pagos accediendo a tu cuenta.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardLink}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Ver Mi Reserva</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¿Necesitas ayuda? Contáctanos en cualquier momento
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "payment_reminder",
    subject: "Recordatorio de Pago - {{tourName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">Recordatorio de Pago</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>{{buyerName}}</strong>,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Te recordamos que tienes un pago pendiente para tu reserva.
              </p>
              
              <div style="background-color: #fff5f5; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Tour:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{tourName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Monto Pendiente:</strong></td>
                    <td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: bold;">\${{amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Fecha Límite:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{dueDate}}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #666666; line-height: 1.6; margin: 20px 0; font-size: 14px; font-style: italic;">
                Importante: Si no se recibe el pago antes de la fecha límite, tu reserva podría ser cancelada automáticamente.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{paymentLink}}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Realizar Pago</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¿Necesitas ayuda? Contáctanos en cualquier momento
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "reservation_cancellation",
    subject: "Reserva Cancelada - {{tourName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #666666; margin: 0 0 20px 0; font-size: 24px;">Reserva Cancelada</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>{{buyerName}}</strong>,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Lamentamos informarte que tu reserva ha sido cancelada.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #666666; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Tour:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{tourName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Motivo:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{reason}}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Esperamos poder servirte en una próxima oportunidad. Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¿Necesitas ayuda? Contáctanos en cualquier momento
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "document_rejection",
    subject: "Documento Rechazado - Acción Requerida",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">Documento Rechazado</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Lamentamos informarte que el documento del pasajero <strong>{{passengerName}}</strong> ha sido rechazado.
              </p>
              
              <div style="background-color: #fff5f5; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;"><strong>Motivo del Rechazo:</strong></p>
                <p style="color: #333333; margin: 0; font-size: 14px;">{{rejectionReason}}</p>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Por favor, sube un nuevo documento que cumpla con los requisitos necesarios.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{uploadLink}}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Subir Nuevo Documento</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¿Necesitas ayuda? Contáctanos en cualquier momento
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "payment_confirmed",
    subject: "¡Pago Confirmado! - {{tourName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">¡Tu pago ha sido confirmado!</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #16a34a; margin: 0 0 20px 0; font-size: 24px;">✓ Pago Confirmado</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>{{buyerName}}</strong>,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                ¡Excelentes noticias! Hemos recibido y confirmado tu pago.
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Monto Pagado:</strong></td>
                    <td style="padding: 8px 0; color: #16a34a; font-size: 16px; font-weight: bold;">\${{amount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Fecha de Pago:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{paymentDate}}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Adjunto encontrarás el itinerario completo de tu viaje. ¡Estamos emocionados de acompañarte en esta aventura!
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardLink}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Ver Detalles</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¿Necesitas ayuda? Contáctanos en cualquier momento
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "document_approval",
    subject: "✓ Documento Aprobado - {{passengerName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #16a34a; margin: 0 0 20px 0; font-size: 24px;">✓ Documento Aprobado</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                ¡Buenas noticias! El documento del pasajero <strong>{{passengerName}}</strong> ha sido aprobado exitosamente.
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #16a34a; margin: 0; font-size: 18px; font-weight: bold;">
                  ✓ Documentación Verificada
                </p>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Ya estás un paso más cerca de comenzar tu aventura. Si aún tienes documentos pendientes de otros pasajeros, recuerda subirlos lo antes posible.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardLink}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Ver Reserva</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¿Necesitas ayuda? Contáctanos en cualquier momento
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "welcome_credentials",
    subject: "¡Bienvenido a Tu Destino Tours! - Tus Credenciales de Acceso",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">¡Bienvenido a nuestra familia!</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">¡Bienvenido!</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>{{userName}}</strong>,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Gracias por realizar tu reserva con nosotros. Hemos creado una cuenta para que puedas gestionar tu reserva fácilmente.
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Tus Credenciales de Acceso</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{email}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Contraseña Temporal:</strong></td>
                    <td style="padding: 8px 0; color: #1e40af; font-size: 14px; font-family: monospace;">{{temporaryPassword}}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #fff5e6; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Por tu seguridad, te recomendamos cambiar tu contraseña la primera vez que inicies sesión.
                </p>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Desde tu cuenta podrás:
              </p>
              
              <ul style="color: #333333; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li>Ver detalles completos de tu reserva</li>
                <li>Gestionar tus pagos y ver tu calendario de cuotas</li>
                <li>Subir documentación de pasajeros</li>
                <li>Descargar tu itinerario de viaje</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{loginLink}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Iniciar Sesión Ahora</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¿Necesitas ayuda? Contáctanos en cualquier momento
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "trip_reminder",
    subject: "¡Tu viaje se acerca! - {{tourName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tu Destino Tours</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">¡La aventura está por comenzar!</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">🎉 ¡Tu Viaje Se Acerca!</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>{{buyerName}}</strong>,
              </p>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                ¡Estamos emocionados! Tu viaje a <strong>{{tourName}}</strong> está a la vuelta de la esquina.
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">Fecha de Salida</p>
                <p style="color: #1e40af; margin: 0; font-size: 24px; font-weight: bold;">{{departureDate}}</p>
                <p style="color: #666666; margin: 10px 0 0 0; font-size: 14px;">{{daysUntilDeparture}} días restantes</p>
              </div>
              
              <h3 style="color: #1e40af; margin: 30px 0 15px 0; font-size: 18px;">Preparativos Importantes:</h3>
              
              <ul style="color: #333333; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li>Verifica que toda tu documentación esté en orden</li>
                <li>Revisa el itinerario adjunto para conocer los detalles del viaje</li>
                <li>Prepara tu equipaje según las recomendaciones</li>
                <li>Confirma tus datos de contacto estén actualizados</li>
              </ul>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardLink}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Ver Mi Itinerario</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Tu Destino Tours</strong>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                ¡Nos vemos pronto! ¿Necesitas ayuda? Contáctanos
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "cliente",
    isActive: true,
  },
  
  {
    templateType: "admin_new_reservation",
    subject: "[Admin] Nueva Reserva Recibida - {{tourName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background-color: #1e293b; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🔔 Nueva Reserva</h1>
              <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">Panel de Administración</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 22px;">Nueva Reserva Recibida</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Se ha registrado una nueva reserva en el sistema.
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">Detalles de la Reserva</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px; width: 40%;"><strong>ID Reserva:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{reservationId}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Tour:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{tourName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Cliente:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{buyerName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{buyerEmail}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Teléfono:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{buyerPhone}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Pasajeros:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{numberOfPassengers}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Total:</strong></td>
                    <td style="padding: 6px 0; color: #1e40af; font-size: 16px; font-weight: bold;">\${{totalPrice}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Fecha Salida:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{departureDate}}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{adminLink}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Ver en Panel Admin</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; margin: 0; font-size: 12px;">
                Notificación automática del sistema - Tu Destino Tours
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "admin",
    isActive: true,
  },
  
  {
    templateType: "admin_document_uploaded",
    subject: "[Admin] Nuevo Documento Subido - Requiere Revisión",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background-color: #1e293b; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">📄 Documento Subido</h1>
              <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">Panel de Administración</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 22px;">Nuevo Documento Requiere Revisión</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Un cliente ha subido un nuevo documento que requiere verificación.
              </p>
              
              <div style="background-color: #fff5e6; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">⚠️ Acción Requerida</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px; width: 40%;"><strong>Pasajero:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{passengerName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Reserva ID:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{reservationId}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Tour:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{tourName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Tipo Documento:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{documentType}}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Por favor, revisa el documento lo antes posible y apruébalo o recházalo según corresponda.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{adminLink}}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Revisar Documento</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; margin: 0; font-size: 12px;">
                Notificación automática del sistema - Tu Destino Tours
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "admin",
    isActive: true,
  },
  
  {
    templateType: "admin_reservation_expiring",
    subject: "[Admin] Alerta: Reserva Próxima a Expirar - {{tourName}}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; margin: 20px 0;">
          <tr>
            <td style="background-color: #1e293b; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">⏰ Alerta de Vencimiento</h1>
              <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">Panel de Administración</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 22px;">Reserva Próxima a Expirar</h2>
              
              <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Una reserva está próxima a su fecha límite de pago y puede ser cancelada automáticamente si no se recibe el pago.
              </p>
              
              <div style="background-color: #fff5f5; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">⚠️ Acción Urgente Requerida</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px; width: 40%;"><strong>Reserva ID:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{reservationId}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Cliente:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{buyerName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{buyerEmail}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Tour:</strong></td>
                    <td style="padding: 6px 0; color: #333333; font-size: 14px;">{{tourName}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Monto Pendiente:</strong></td>
                    <td style="padding: 6px 0; color: #dc2626; font-size: 16px; font-weight: bold;">\${{pendingAmount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Fecha Límite:</strong></td>
                    <td style="padding: 6px 0; color: #dc2626; font-size: 14px; font-weight: bold;">{{dueDate}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666666; font-size: 14px;"><strong>Días Restantes:</strong></td>
                    <td style="padding: 6px 0; color: #dc2626; font-size: 14px; font-weight: bold;">{{daysRemaining}}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                Considera contactar al cliente para confirmar el estado del pago o extender el plazo si es necesario.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{adminLink}}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">Ver Reserva</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; margin: 0; font-size: 12px;">
                Notificación automática del sistema - Tu Destino Tours
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    category: "admin",
    isActive: true,
  },
];

export async function seedEmailTemplates() {
  console.log("🌱 Seeding email templates...");
  
  try {
    for (const template of templates) {
      const existing = await db.query.emailTemplates.findFirst({
        where: (emailTemplates, { eq }) => eq(emailTemplates.templateType, template.templateType),
      });

      if (existing) {
        console.log(`  ⏭️  Template "${template.templateType}" already exists, skipping...`);
      } else {
        await db.insert(emailTemplates).values(template);
        console.log(`  ✓ Created template: ${template.templateType}`);
      }
    }
    
    console.log("✅ Email templates seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding email templates:", error);
    throw error;
  }
}
