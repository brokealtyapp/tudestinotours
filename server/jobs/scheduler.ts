import cron from "node-cron";
import { storage } from "../storage";
import { emailService } from "../services/emailService";
import { smtpService } from "../services/smtpService";

// Calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / msPerDay);
}

// Process payment reminders using reminder_rules configuration
async function processPaymentReminders() {
  console.log("[SCHEDULER] Procesando recordatorios de pago...");
  
  try {
    const reservations = await storage.getReservationsForReminders();
    const reminderRules = await storage.getReminderRules();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Filter only enabled rules and sort by days before deadline
    const enabledRules = reminderRules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.daysBeforeDeadline - a.daysBeforeDeadline);

    if (enabledRules.length === 0) {
      console.log("[SCHEDULER] No hay reglas de recordatorio habilitadas");
      return;
    }

    for (const reservation of reservations) {
      if (!reservation.paymentDueDate) {
        continue;
      }

      const daysUntilDue = daysBetween(now, new Date(reservation.paymentDueDate));
      
      // Find the next reminder rule that should be sent
      const nextRule = enabledRules.find(rule => {
        // Check if we're at or past this threshold
        if (daysUntilDue <= rule.daysBeforeDeadline) {
          // Check if we haven't sent this threshold yet
          const lastSent = reservation.lastReminderSent || 999;
          if (rule.daysBeforeDeadline >= lastSent) {
            return false; // Already sent this or later threshold
          }
          
          // Check if we're within the configured send time window (60 minutes tolerance)
          const [ruleHour, ruleMinute] = rule.sendTime.split(':').map(Number);
          
          // Calculate absolute difference in minutes
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const ruleTotalMinutes = ruleHour * 60 + ruleMinute;
          const minutesDiff = Math.abs(currentTotalMinutes - ruleTotalMinutes);
          
          // Only send if we're within 60 minutes of the configured time
          // This prevents sending multiple times per day
          if (minutesDiff > 60) {
            return false;
          }
          
          return true;
        }
        return false;
      });

      if (nextRule && reservation.userId) {
        // Get user and tour info
        const user = await storage.getUser(reservation.userId);
        const tour = reservation.tourId ? await storage.getTour(reservation.tourId) : null;
        const departure = reservation.departureId ? await storage.getDeparture(reservation.departureId) : null;

        if (user && tour && departure) {
          // Prepare variables for template
          const totalPrice = typeof reservation.totalPrice === 'number' 
            ? reservation.totalPrice 
            : parseFloat(reservation.totalPrice);
          
          const variables = {
            nombre_cliente: user.name,
            tour_nombre: tour.title,
            codigo_reserva: reservation.id.substring(0, 8).toUpperCase(),
            monto_total: totalPrice.toFixed(2),
            fecha_limite: new Date(reservation.paymentDueDate).toLocaleDateString('es-ES'),
            dias_restantes: daysUntilDue.toString(),
            fecha_salida: new Date(departure.departureDate).toLocaleDateString('es-ES'),
          };

          // Send email using SMTP service with template
          const success = await smtpService.sendTemplateEmail(
            user.email,
            nextRule.templateType,
            variables,
            reservation.id
          );

          if (success) {
            // Log the notification
            await storage.createReservationNotification({
              reservationId: reservation.id,
              notificationType: "payment_reminder",
              daysBeforeDeparture: nextRule.daysBeforeDeadline,
              emailStatus: "sent",
            });

            // Create timeline event
            await storage.createTimelineEvent({
              reservationId: reservation.id,
              eventType: "email_sent",
              description: `Recordatorio de pago enviado (${nextRule.daysBeforeDeadline} días antes)`,
              metadata: JSON.stringify({ templateType: nextRule.templateType }),
            });

            // Update last reminder sent
            await storage.updateReservationAutomationFields(reservation.id, {
              lastReminderSent: nextRule.daysBeforeDeadline,
            });

            console.log(`[SCHEDULER] Recordatorio enviado para reserva ${reservation.id} (${nextRule.daysBeforeDeadline} días)`);
          }
        }
      }
    }

    console.log(`[SCHEDULER] Recordatorios procesados: ${reservations.length} reservas revisadas`);
  } catch (error) {
    console.error("[SCHEDULER] Error procesando recordatorios:", error);
  }
}

// Process automatic cancellations
async function processAutoCancellations() {
  console.log("[SCHEDULER] Procesando cancelaciones automáticas...");
  
  try {
    const reservations = await storage.getReservationsForCancellation();
    const now = new Date();

    for (const reservation of reservations) {
      if (!reservation.paymentDueDate) {
        continue;
      }

      const paymentDueDate = new Date(reservation.paymentDueDate);
      const autoCancelAt = reservation.autoCancelAt ? new Date(reservation.autoCancelAt) : null;

      // Check if payment is overdue
      if (paymentDueDate <= now) {
        // If status is still pending/approved, mark as vencida
        if (reservation.status === "pending" || reservation.status === "approved") {
          await storage.updateReservationAutomationFields(reservation.id, {
            status: "vencida",
          });

          // Get user and tour info
          const user = reservation.userId ? await storage.getUser(reservation.userId) : null;
          const tour = reservation.tourId ? await storage.getTour(reservation.tourId) : null;

          if (user && tour) {
            await emailService.sendCancellationNotice(user, reservation, tour, "vencida");
            
            await storage.createReservationNotification({
              reservationId: reservation.id,
              notificationType: "status_vencida",
              emailStatus: "sent",
            });
          }

          console.log(`[SCHEDULER] Reserva ${reservation.id} marcada como vencida`);
        }
        
        // If auto-cancel time has passed and status is vencida, cancel completely
        if (autoCancelAt && autoCancelAt <= now && reservation.status === "vencida") {
          await storage.updateReservationAutomationFields(reservation.id, {
            status: "cancelada",
          });

          // Release seats
          await storage.decrementReservedSeats(
            reservation.tourId,
            reservation.numberOfPassengers
          );

          // Get user and tour info
          const user = reservation.userId ? await storage.getUser(reservation.userId) : null;
          const tour = reservation.tourId ? await storage.getTour(reservation.tourId) : null;

          if (user && tour) {
            await emailService.sendCancellationNotice(user, reservation, tour, "cancelada");
            
            await storage.createReservationNotification({
              reservationId: reservation.id,
              notificationType: "status_cancelada",
              emailStatus: "sent",
            });
          }

          console.log(`[SCHEDULER] Reserva ${reservation.id} cancelada automáticamente y cupos liberados`);
        }
      }
    }

    console.log(`[SCHEDULER] Cancelaciones procesadas: ${reservations.length} reservas revisadas`);
  } catch (error) {
    console.error("[SCHEDULER] Error procesando cancelaciones:", error);
  }
}

// Initialize scheduler
export function initializeScheduler() {
  console.log("[SCHEDULER] Iniciando scheduler de tareas automatizadas...");

  // Run payment reminders daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[SCHEDULER] Ejecutando tarea diaria: recordatorios de pago");
    await processPaymentReminders();
  });

  // Run auto-cancellations daily at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[SCHEDULER] Ejecutando tarea diaria: cancelaciones automáticas");
    await processAutoCancellations();
  });

  // Also run both jobs every 6 hours for more responsive automation
  cron.schedule("0 */6 * * *", async () => {
    console.log("[SCHEDULER] Ejecutando tarea cada 6 horas");
    await processPaymentReminders();
    await processAutoCancellations();
  });

  console.log("[SCHEDULER] Scheduler inicializado correctamente");
  console.log("[SCHEDULER] - Recordatorios de pago: Diariamente a las 8:00 AM y cada 6 horas");
  console.log("[SCHEDULER] - Cancelaciones automáticas: Diariamente a las 9:00 AM y cada 6 horas");

  // Run immediately on startup for testing
  console.log("[SCHEDULER] Ejecutando tareas iniciales...");
  processPaymentReminders().catch(console.error);
  processAutoCancellations().catch(console.error);
}
