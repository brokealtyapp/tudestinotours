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
          
          // Calculate absolute difference in minutes with midnight wraparound
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const ruleTotalMinutes = ruleHour * 60 + ruleMinute;
          
          // Calculate circular distance (handles midnight wraparound)
          const rawDiff = Math.abs(currentTotalMinutes - ruleTotalMinutes);
          const minutesDiff = Math.min(rawDiff, 1440 - rawDiff);
          
          // Only send if we're within 60 minutes of the configured time
          // This prevents sending multiple times per day and handles midnight correctly
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
          // Usar método normal para cambio a "vencida" (no libera cupos aún)
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
          // CRÍTICO: Usar método atómico para garantizar que cancelación + liberación de cupos sean una transacción
          await storage.autoCancelReservationAtomic(reservation.id, "cancelada");

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

// Process admin alerts for expiring reservations
async function processAdminReservationExpiring() {
  console.log("[SCHEDULER] Procesando alertas de reservas próximas a vencer...");
  
  try {
    const reservations = await storage.getReservationsForReminders();
    const adminUser = await storage.getUserByRole('admin');
    
    if (!adminUser) {
      console.log("[SCHEDULER] No se encontró usuario administrador para enviar alertas");
      return;
    }

    const now = new Date();
    let alertsSent = 0;

    for (const reservation of reservations) {
      if (!reservation.paymentDueDate || reservation.paymentStatus !== 'pending') {
        continue;
      }

      const daysUntilDue = daysBetween(now, new Date(reservation.paymentDueDate));
      
      // Send alert if reservation is expiring in 3 days and admin hasn't been alerted yet
      if (daysUntilDue === 3 && !reservation.adminAlertSent) {
        const tour = reservation.tourId ? await storage.getTour(reservation.tourId) : null;
        
        if (tour) {
          await emailService.sendAdminReservationExpiring(
            adminUser.email,
            reservation,
            tour,
            daysUntilDue
          );

          // Mark alert as sent
          await storage.updateReservationAutomationFields(reservation.id, {
            adminAlertSent: true,
          });

          await storage.createTimelineEvent({
            reservationId: reservation.id,
            eventType: "email_sent",
            description: `Alerta enviada al admin: reserva vence en ${daysUntilDue} días`,
            metadata: JSON.stringify({ alertType: 'admin_expiring', daysRemaining: daysUntilDue }),
          });

          alertsSent++;
          console.log(`[SCHEDULER] Alerta enviada al admin para reserva ${reservation.id} (vence en ${daysUntilDue} días)`);
        }
      }
    }

    console.log(`[SCHEDULER] Alertas de admin enviadas: ${alertsSent} de ${reservations.length} reservas revisadas`);
  } catch (error) {
    console.error("[SCHEDULER] Error procesando alertas de admin:", error);
  }
}

// Process trip reminders for clients
async function processTripReminders() {
  console.log("[SCHEDULER] Procesando recordatorios de viaje próximo...");
  
  try {
    // Get all confirmed reservations (paid)
    const allReservations = await storage.getReservations();
    const confirmedReservations = allReservations.filter((r: any) => 
      r.paymentStatus === 'confirmed' && r.status === 'approved'
    );

    const now = new Date();
    let remindersSent = 0;

    for (const reservation of confirmedReservations) {
      if (!reservation.departureDate) {
        continue;
      }

      const daysUntilTrip = daysBetween(now, new Date(reservation.departureDate));
      
      // Send reminder if trip is in 7 days and reminder hasn't been sent yet
      if (daysUntilTrip === 7 && !reservation.tripReminderSent) {
        const user = reservation.userId ? await storage.getUser(reservation.userId) : null;
        const tour = reservation.tourId ? await storage.getTour(reservation.tourId) : null;
        
        if (user && tour) {
          await emailService.sendTripReminder(
            user,
            reservation,
            tour,
            daysUntilTrip
          );

          // Mark reminder as sent
          await storage.updateReservationAutomationFields(reservation.id, {
            tripReminderSent: true,
          });

          await storage.createTimelineEvent({
            reservationId: reservation.id,
            eventType: "email_sent",
            description: `Recordatorio de viaje enviado (${daysUntilTrip} días antes de la salida)`,
            metadata: JSON.stringify({ reminderType: 'trip_reminder', daysUntilTrip }),
          });

          remindersSent++;
          console.log(`[SCHEDULER] Recordatorio de viaje enviado para reserva ${reservation.id} (salida en ${daysUntilTrip} días)`);
        }
      }
    }

    console.log(`[SCHEDULER] Recordatorios de viaje enviados: ${remindersSent} de ${confirmedReservations.length} reservas confirmadas`);
  } catch (error) {
    console.error("[SCHEDULER] Error procesando recordatorios de viaje:", error);
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

  // Run admin alerts daily at 10:00 AM
  cron.schedule("0 10 * * *", async () => {
    console.log("[SCHEDULER] Ejecutando tarea diaria: alertas de admin");
    await processAdminReservationExpiring();
  });

  // Run trip reminders daily at 11:00 AM
  cron.schedule("0 11 * * *", async () => {
    console.log("[SCHEDULER] Ejecutando tarea diaria: recordatorios de viaje");
    await processTripReminders();
  });

  // Also run both jobs every 6 hours for more responsive automation
  cron.schedule("0 */6 * * *", async () => {
    console.log("[SCHEDULER] Ejecutando tarea cada 6 horas");
    await processPaymentReminders();
    await processAutoCancellations();
  });

  // Run admin alerts and trip reminders once per day (don't run every 6 hours)
  cron.schedule("0 0 * * *", async () => {
    console.log("[SCHEDULER] Ejecutando tarea diaria a medianoche");
    await processAdminReservationExpiring();
    await processTripReminders();
  });

  console.log("[SCHEDULER] Scheduler inicializado correctamente");
  console.log("[SCHEDULER] - Recordatorios de pago: Diariamente a las 8:00 AM y cada 6 horas");
  console.log("[SCHEDULER] - Cancelaciones automáticas: Diariamente a las 9:00 AM y cada 6 horas");
  console.log("[SCHEDULER] - Alertas de admin: Diariamente a las 10:00 AM y medianoche");
  console.log("[SCHEDULER] - Recordatorios de viaje: Diariamente a las 11:00 AM y medianoche");

  // Run immediately on startup for testing
  console.log("[SCHEDULER] Ejecutando tareas iniciales...");
  processPaymentReminders().catch(console.error);
  processAutoCancellations().catch(console.error);
  processAdminReservationExpiring().catch(console.error);
  processTripReminders().catch(console.error);
}
