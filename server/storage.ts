import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Tour,
  type InsertTour,
  type Departure,
  type InsertDeparture,
  type Reservation,
  type InsertReservation,
  type Passenger,
  type InsertPassenger,
  type Payment,
  type InsertPayment,
  type ReservationNotification,
  type InsertReservationNotification,
  type PaymentInstallment,
  type InsertPaymentInstallment,
  type SystemConfig,
  type InsertSystemConfig,
  type ReservationTimelineEvent,
  type InsertReservationTimelineEvent,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailTemplateVersion,
  type InsertEmailTemplateVersion,
  type ReminderRule,
  type InsertReminderRule,
  type EmailLog,
  type InsertEmailLog,
  type AuditLog,
  type InsertAuditLog,
  type SystemSetting,
  type InsertSystemSetting,
  users,
  tours,
  departures,
  reservations,
  passengers,
  payments,
  reservationNotifications,
  paymentInstallments,
  systemConfig,
  reservationTimelineEvents,
  emailTemplates,
  emailTemplateVersions,
  reminderRules,
  emailLogs,
  auditLogs,
  systemSettings,
  insertPaymentInstallmentSchema,
  insertPassengerSchema,
  insertDepartureSchema,
  insertReservationSchema,
} from "@shared/schema";
import { eq, desc, and, or, ilike, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  findOrCreateClientUser(email: string, name: string): Promise<{ user: User; isNewUser: boolean; generatedPassword?: string }>;
  
  // Tour methods
  getTours(): Promise<Tour[]>;
  getTour(id: string): Promise<Tour | undefined>;
  searchTours(location?: string): Promise<Tour[]>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  deleteTour(id: string): Promise<void>;
  
  // Departure methods
  getDepartures(tourId?: string): Promise<Departure[]>;
  getDeparture(id: string): Promise<Departure | undefined>;
  createDeparture(departure: InsertDeparture): Promise<Departure>;
  updateDeparture(id: string, departure: Partial<InsertDeparture>): Promise<Departure | undefined>;
  deleteDeparture(id: string): Promise<void>;
  updateDepartureSeats(id: string, seatsChange: number): Promise<void>;
  
  // Reservation methods
  getReservations(userId?: string): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  createReservationAtomic(reservation: InsertReservation, departureId: string, numberOfPassengers: number): Promise<Reservation>;
  createReservationsInBulkAtomic(reservationsData: Array<{
    reservation: InsertReservation;
    departureId: string;
    passengers: Array<InsertPassenger>;
  }>): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: string, status: string, paymentStatus?: string): Promise<Reservation | undefined>;
  cancelReservationAtomic(reservationId: string, newStatus: string, newPaymentStatus?: string): Promise<Reservation>;
  
  // Passenger methods
  getAllPassengers(): Promise<Passenger[]>;
  getPassenger(id: string): Promise<Passenger | undefined>;
  getPassengersByReservation(reservationId: string): Promise<Passenger[]>;
  createPassenger(passenger: InsertPassenger): Promise<Passenger>;
  updatePassengerDocumentStatus(id: string, status: string, notes?: string): Promise<Passenger | undefined>;
  
  // Payment methods
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string, confirmedBy?: string): Promise<Payment | undefined>;
  
  // Reservation notification methods
  createReservationNotification(notification: InsertReservationNotification): Promise<ReservationNotification>;
  getReservationNotifications(reservationId: string): Promise<ReservationNotification[]>;
  
  // Seat management methods
  incrementReservedSeats(tourId: string, count: number): Promise<void>;
  decrementReservedSeats(tourId: string, count: number): Promise<void>;
  
  // Reservation automation methods
  getReservationsForReminders(): Promise<Reservation[]>;
  getReservationsForCancellation(): Promise<Reservation[]>;
  updateReservationAutomationFields(id: string, fields: Partial<Pick<Reservation, 'lastReminderSent' | 'autoCancelAt' | 'status' | 'paymentStatus' | 'adminAlertSent' | 'tripReminderSent'>>): Promise<Reservation | undefined>;
  autoCancelReservationAtomic(reservationId: string, newStatus: string): Promise<Reservation>;
  
  // Payment installments methods
  getPaymentInstallment(id: string): Promise<PaymentInstallment | undefined>;
  getPaymentInstallments(reservationId: string): Promise<PaymentInstallment[]>;
  createPaymentInstallment(installment: InsertPaymentInstallment): Promise<PaymentInstallment>;
  updatePaymentInstallment(id: string, data: Partial<InsertPaymentInstallment>): Promise<PaymentInstallment | undefined>;
  markInstallmentAsPaid(id: string, paidBy: string): Promise<PaymentInstallment | undefined>;
  deletePaymentInstallment(id: string): Promise<void>;
  
  // System config methods
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig>;
  getAllSystemConfigs(): Promise<SystemConfig[]>;
  
  // Timeline events methods
  createTimelineEvent(event: InsertReservationTimelineEvent): Promise<ReservationTimelineEvent>;
  getTimelineEvents(reservationId: string): Promise<ReservationTimelineEvent[]>;
  
  // Reports methods
  getSalesReport(startDate: Date, endDate: Date, tourId?: string, departureId?: string): Promise<SalesReport>;
  getOccupationReport(startDate: Date, endDate: Date, tourId?: string): Promise<OccupationReportItem[]>;
  getAgingReport(): Promise<AgingReport>;
  
  // Reconciliation methods
  getReconciliationData(filters?: { startDate?: string; endDate?: string; status?: string; minAmount?: number }): Promise<any[]>;
  
  // Payment calendar methods
  getPaymentCalendar(startDate: string, endDate: string): Promise<any[]>;
  
  // Email template methods
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateByType(templateType: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>, userId?: string): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<void>;
  
  // Email template version methods
  createEmailTemplateVersion(version: InsertEmailTemplateVersion): Promise<EmailTemplateVersion>;
  getEmailTemplateVersions(templateId: string): Promise<EmailTemplateVersion[]>;
  
  // Reminder rules methods
  getReminderRules(): Promise<ReminderRule[]>;
  getReminderRule(id: string): Promise<ReminderRule | undefined>;
  createReminderRule(rule: InsertReminderRule): Promise<ReminderRule>;
  updateReminderRule(id: string, rule: Partial<InsertReminderRule>): Promise<ReminderRule | undefined>;
  deleteReminderRule(id: string): Promise<void>;
  
  // Email logs methods
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByReservation(reservationId: string): Promise<EmailLog[]>;
  getEmailLog(id: string): Promise<EmailLog | undefined>;
  
  // Audit logs methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByReservation(reservationId: string): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;

  // User management methods
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  updateUserPermissions(id: string, permissions: string[]): Promise<User | undefined>;
  updateUserRole(id: string, role: string, permissions: string[]): Promise<User | undefined>;
  toggleUserActive(id: string, active: boolean): Promise<User | undefined>;

  // System settings methods
  getSettings(category?: string): Promise<SystemSetting[]>;
  getSetting(key: string): Promise<SystemSetting | undefined>;
  createSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting | undefined>;
  deleteSetting(key: string): Promise<void>;
}

export interface SalesReport {
  summary: {
    totalRevenue: number;
    totalReservations: number;
    averageOrderValue: number;
  };
  byTour: Array<{
    tourId: string;
    tourName: string;
    revenue: number;
    count: number;
  }>;
  byMonth: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
}

export interface OccupationReportItem {
  departureId: string;
  tourId: string;
  tourName: string;
  departureDate: Date;
  returnDate: Date | null;
  totalSeats: number;
  reservedSeats: number;
  occupationPercentage: number;
}

export interface AgingReport {
  buckets: {
    current: number;
    days8to14: number;
    days15to30: number;
    overdue: number;
  };
  reservations: Array<{
    id: string;
    code: string;
    tourName: string;
    buyerName: string;
    buyerEmail: string;
    totalPrice: number;
    balanceDue: number;
    paymentDueDate: Date | null;
    daysOverdue: number;
    status: string;
    paymentStatus: string;
  }>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByRole(role: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.role, role)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async findOrCreateClientUser(email: string, name: string): Promise<{ user: User; isNewUser: boolean; generatedPassword?: string }> {
    // Buscar usuario existente
    const existingUser = await this.getUserByEmail(email);
    
    if (existingUser) {
      return { user: existingUser, isNewUser: false };
    }
    
    // Generar contraseña aleatoria
    const bcrypt = await import("bcryptjs");
    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    
    // Crear nuevo usuario cliente
    const newUser = await this.createUser({
      email,
      name,
      password: hashedPassword,
      role: "client",
      permissions: [],
      active: true,
    });
    
    return { user: newUser, isNewUser: true, generatedPassword };
  }

  // Tour methods
  async getTours(): Promise<Tour[]> {
    return await db.select().from(tours).orderBy(desc(tours.createdAt));
  }

  async getTour(id: string): Promise<Tour | undefined> {
    const result = await db.select().from(tours).where(eq(tours.id, id)).limit(1);
    return result[0];
  }

  async searchTours(location?: string): Promise<Tour[]> {
    if (!location) {
      return this.getTours();
    }
    return await db
      .select()
      .from(tours)
      .where(ilike(tours.location, `%${location}%`))
      .orderBy(desc(tours.createdAt));
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const result = await db.insert(tours).values(tour).returning();
    return result[0];
  }

  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const result = await db
      .update(tours)
      .set(tour)
      .where(eq(tours.id, id))
      .returning();
    return result[0];
  }

  async deleteTour(id: string): Promise<void> {
    await db.delete(tours).where(eq(tours.id, id));
  }

  // Departure methods
  async getDepartures(tourId?: string): Promise<Departure[]> {
    if (tourId) {
      return await db
        .select()
        .from(departures)
        .where(eq(departures.tourId, tourId))
        .orderBy(desc(departures.departureDate));
    }
    return await db.select().from(departures).orderBy(desc(departures.departureDate));
  }

  async getDeparture(id: string): Promise<Departure | undefined> {
    const result = await db.select().from(departures).where(eq(departures.id, id)).limit(1);
    return result[0];
  }

  async createDeparture(departure: InsertDeparture): Promise<Departure> {
    // Validar y transformar fechas con el schema
    const validatedDeparture = insertDepartureSchema.parse(departure);
    const result = await db.insert(departures).values(validatedDeparture).returning();
    return result[0];
  }

  async updateDeparture(id: string, departure: Partial<InsertDeparture>): Promise<Departure | undefined> {
    const result = await db
      .update(departures)
      .set(departure)
      .where(eq(departures.id, id))
      .returning();
    return result[0];
  }

  async deleteDeparture(id: string): Promise<void> {
    await db.delete(departures).where(eq(departures.id, id));
  }

  async updateDepartureSeats(id: string, seatsChange: number): Promise<void> {
    const departure = await this.getDeparture(id);
    if (!departure) {
      throw new Error("Departure not found");
    }
    
    const newReservedSeats = departure.reservedSeats + seatsChange;
    if (newReservedSeats < 0 || newReservedSeats > departure.totalSeats) {
      throw new Error("Invalid seats change: would exceed capacity or go below zero");
    }

    await db
      .update(departures)
      .set({ reservedSeats: newReservedSeats })
      .where(eq(departures.id, id));
  }

  // Reservation methods
  async getReservations(userId?: string): Promise<any[]> {
    const query = db
      .select({
        id: reservations.id,
        reservationCode: reservations.reservationCode,
        tourId: reservations.tourId,
        departureId: reservations.departureId,
        userId: reservations.userId,
        buyerName: reservations.buyerName,
        buyerEmail: reservations.buyerEmail,
        buyerPhone: reservations.buyerPhone,
        reservationDate: reservations.reservationDate,
        departureDate: reservations.departureDate,
        numberOfPassengers: reservations.numberOfPassengers,
        totalPrice: reservations.totalPrice,
        status: reservations.status,
        paymentStatus: reservations.paymentStatus,
        paymentDueDate: reservations.paymentDueDate,
        paymentLink: reservations.paymentLink,
        autoCancelAt: reservations.autoCancelAt,
        lastReminderSent: reservations.lastReminderSent,
        createdAt: reservations.createdAt,
        tour: {
          title: tours.title,
          location: tours.location,
        },
      })
      .from(reservations)
      .leftJoin(tours, eq(reservations.tourId, tours.id));

    if (userId) {
      return await query
        .where(eq(reservations.userId, userId))
        .orderBy(desc(reservations.createdAt));
    }
    return await query.orderBy(desc(reservations.createdAt));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
    return result[0];
  }

  private async generateReservationCode(tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TD-${year}-`;
    
    // Obtener el último código del año actual
    const lastReservation = await tx
      .select({ reservationCode: reservations.reservationCode })
      .from(reservations)
      .where(sql`${reservations.reservationCode} LIKE ${prefix + '%'}`)
      .orderBy(desc(reservations.reservationCode))
      .limit(1);
    
    let nextNumber = 1;
    if (lastReservation.length > 0 && lastReservation[0].reservationCode) {
      const lastCode = lastReservation[0].reservationCode;
      const lastNumber = parseInt(lastCode.split('-')[2] || '0');
      nextNumber = lastNumber + 1;
    }
    
    // Formatear con 3 dígitos (001, 002, etc.)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${formattedNumber}`;
  }

  async createReservationAtomic(reservation: InsertReservation, departureId: string, numberOfPassengers: number): Promise<Reservation> {
    // Validar y transformar fechas con el schema para defensa en profundidad
    const validatedReservation = insertReservationSchema.parse(reservation);
    
    return await db.transaction(async (tx) => {
      // 0. Generar código de reserva único
      const reservationCode = await this.generateReservationCode(tx);
      // 1. Obtener y bloquear la salida para actualización
      const departureResult = await tx
        .select()
        .from(departures)
        .where(eq(departures.id, departureId))
        .for('update'); // Bloqueo pesimista - previene race conditions
      
      const departure = departureResult[0];
      if (!departure) {
        throw new Error("Salida no encontrada");
      }

      // 2. Verificar cupos disponibles
      const availableSeats = departure.totalSeats - departure.reservedSeats;
      if (numberOfPassengers > availableSeats) {
        throw new Error(`No hay suficientes cupos disponibles. Disponibles: ${availableSeats}, Solicitados: ${numberOfPassengers}`);
      }

      // 3. Crear la reserva con datos validados y código generado
      const newReservationResult = await tx
        .insert(reservations)
        .values({ ...validatedReservation, reservationCode })
        .returning();
      
      const newReservation = newReservationResult[0];

      // 4. Actualizar cupos de la salida
      await tx
        .update(departures)
        .set({ reservedSeats: departure.reservedSeats + numberOfPassengers })
        .where(eq(departures.id, departureId));

      // 5. También actualizar cupos del tour (para compatibilidad)
      const tourResult = await tx
        .select()
        .from(tours)
        .where(eq(tours.id, departure.tourId))
        .for('update');
      
      const tour = tourResult[0];
      if (tour) {
        await tx
          .update(tours)
          .set({ reservedSeats: tour.reservedSeats + numberOfPassengers })
          .where(eq(tours.id, departure.tourId));
      }

      return newReservation;
    });
  }

  async createReservationsInBulkAtomic(reservationsData: Array<{
    reservation: InsertReservation;
    departureId: string;
    passengers: Array<InsertPassenger>;
  }>): Promise<Reservation[]> {
    return await db.transaction(async (tx) => {
      const createdReservations: Reservation[] = [];
      
      // Group reservations by departureId for seat validation
      const departureSeatsNeeded = new Map<string, number>();
      for (const { departureId, reservation } of reservationsData) {
        const current = departureSeatsNeeded.get(departureId) || 0;
        departureSeatsNeeded.set(departureId, current + reservation.numberOfPassengers);
      }
      
      // 1. Lock and validate all departures first
      const departureLocks = new Map<string, any>();
      for (const [departureId, seatsNeeded] of Array.from(departureSeatsNeeded.entries())) {
        const departureResult = await tx
          .select()
          .from(departures)
          .where(eq(departures.id, departureId))
          .for('update');
        
        const departure = departureResult[0];
        if (!departure) {
          throw new Error(`Salida ${departureId} no encontrada`);
        }
        
        const availableSeats = departure.totalSeats - departure.reservedSeats;
        if (seatsNeeded > availableSeats) {
          throw new Error(
            `No hay suficientes cupos en salida ${departureId}. Disponibles: ${availableSeats}, Solicitados: ${seatsNeeded}`
          );
        }
        
        departureLocks.set(departureId, departure);
      }
      
      // 2. Create all reservations
      for (const { reservation, departureId, passengers: passengersList } of reservationsData) {
        // Generate unique reservation code
        const reservationCode = await this.generateReservationCode(tx);
        
        // Create reservation with code
        const newReservationResult = await tx
          .insert(reservations)
          .values({ ...reservation, reservationCode })
          .returning();
        
        const newReservation = newReservationResult[0];
        createdReservations.push(newReservation);
        
        // Create passengers for this reservation
        if (passengersList.length > 0) {
          await tx.insert(passengers).values(
            passengersList.map(p => ({
              ...p,
              reservationId: newReservation.id,
            }))
          );
        }
        
        // Update departure seats
        const departure = departureLocks.get(departureId)!;
        await tx
          .update(departures)
          .set({ reservedSeats: departure.reservedSeats + reservation.numberOfPassengers })
          .where(eq(departures.id, departureId));
        
        // Update cached departure
        departure.reservedSeats += reservation.numberOfPassengers;
        
        // Update tour seats
        const tourResult = await tx
          .select()
          .from(tours)
          .where(eq(tours.id, reservation.tourId))
          .for('update');
        
        const tour = tourResult[0];
        if (tour) {
          await tx
            .update(tours)
            .set({ reservedSeats: tour.reservedSeats + reservation.numberOfPassengers })
            .where(eq(tours.id, reservation.tourId));
        }
      }
      
      return createdReservations;
    });
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    // Validar y transformar fechas con el schema
    const validatedReservation = insertReservationSchema.parse(reservation);
    
    return await db.transaction(async (tx) => {
      // Generate unique reservation code
      const reservationCode = await this.generateReservationCode(tx);
      
      const result = await tx.insert(reservations).values({ ...validatedReservation, reservationCode }).returning();
      return result[0];
    });
  }

  async cancelReservationAtomic(reservationId: string, newStatus: string, newPaymentStatus?: string): Promise<Reservation> {
    return await db.transaction(async (tx) => {
      // 1. Obtener y bloquear la reserva
      const reservationResult = await tx
        .select()
        .from(reservations)
        .where(eq(reservations.id, reservationId))
        .for('update');
      
      const reservation = reservationResult[0];
      if (!reservation) {
        throw new Error("Reserva no encontrada");
      }

      // 2. Actualizar estado de la reserva
      const updateData: any = { status: newStatus };
      if (newPaymentStatus) {
        updateData.paymentStatus = newPaymentStatus;
      }

      const updatedReservationResult = await tx
        .update(reservations)
        .set(updateData)
        .where(eq(reservations.id, reservationId))
        .returning();
      
      const updatedReservation = updatedReservationResult[0];

      // 3. Liberar cupos de la salida (si existe)
      if (reservation.departureId) {
        const departureResult = await tx
          .select()
          .from(departures)
          .where(eq(departures.id, reservation.departureId))
          .for('update');
        
        const departure = departureResult[0];
        if (departure) {
          const newReservedSeats = Math.max(0, departure.reservedSeats - reservation.numberOfPassengers);
          await tx
            .update(departures)
            .set({ reservedSeats: newReservedSeats })
            .where(eq(departures.id, reservation.departureId));
        }
      }

      // 4. Liberar cupos del tour (para compatibilidad)
      if (reservation.tourId) {
        const tourResult = await tx
          .select()
          .from(tours)
          .where(eq(tours.id, reservation.tourId))
          .for('update');
        
        const tour = tourResult[0];
        if (tour) {
          const newReservedSeats = Math.max(0, tour.reservedSeats - reservation.numberOfPassengers);
          await tx
            .update(tours)
            .set({ reservedSeats: newReservedSeats })
            .where(eq(tours.id, reservation.tourId));
        }
      }

      return updatedReservation;
    });
  }

  async updateReservationStatus(
    id: string,
    status: string,
    paymentStatus?: string
  ): Promise<Reservation | undefined> {
    const updateData: any = { status };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    const result = await db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, id))
      .returning();
    return result[0];
  }

  // Passenger methods
  async getAllPassengers(): Promise<any[]> {
    const results = await db
      .select({
        // Passenger data
        id: passengers.id,
        reservationId: passengers.reservationId,
        fullName: passengers.fullName,
        passportNumber: passengers.passportNumber,
        nationality: passengers.nationality,
        dateOfBirth: passengers.dateOfBirth,
        passportImageUrl: passengers.passportImageUrl,
        documentStatus: passengers.documentStatus,
        documentNotes: passengers.documentNotes,
        createdAt: passengers.createdAt,
        // Reservation data
        reservationCode: reservations.reservationCode,
        buyerName: reservations.buyerName,
        buyerEmail: reservations.buyerEmail,
        buyerPhone: reservations.buyerPhone,
        reservationDate: reservations.reservationDate,
        paymentStatus: reservations.paymentStatus,
        // Tour data
        tourTitle: tours.title,
      })
      .from(passengers)
      .leftJoin(reservations, eq(passengers.reservationId, reservations.id))
      .leftJoin(tours, eq(reservations.tourId, tours.id))
      .orderBy(desc(passengers.createdAt));
    
    return results;
  }

  async getPassenger(id: string): Promise<Passenger | undefined> {
    const result = await db
      .select()
      .from(passengers)
      .where(eq(passengers.id, id))
      .limit(1);
    return result[0];
  }

  async getPassengersByReservation(reservationId: string): Promise<Passenger[]> {
    return await db
      .select()
      .from(passengers)
      .where(eq(passengers.reservationId, reservationId));
  }

  async createPassenger(passenger: InsertPassenger): Promise<Passenger> {
    // Validar y transformar fechas con el schema
    const validatedPassenger = insertPassengerSchema.parse(passenger);
    const result = await db.insert(passengers).values(validatedPassenger).returning();
    return result[0];
  }

  async updatePassengerDocumentStatus(id: string, status: string, notes?: string): Promise<Passenger | undefined> {
    const updateData: any = { documentStatus: status };
    if (notes !== undefined) {
      updateData.documentNotes = notes;
    }
    const result = await db
      .update(passengers)
      .set(updateData)
      .where(eq(passengers.id, id))
      .returning();
    return result[0];
  }

  // Payment methods
  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return result[0];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePaymentStatus(
    id: string,
    status: string,
    confirmedBy?: string
  ): Promise<Payment | undefined> {
    const updateData: any = { status };
    if (confirmedBy) {
      updateData.confirmedBy = confirmedBy;
      updateData.confirmedAt = new Date();
    }
    const result = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  // Reservation notification methods
  async createReservationNotification(notification: InsertReservationNotification): Promise<ReservationNotification> {
    const result = await db.insert(reservationNotifications).values(notification).returning();
    return result[0];
  }

  async getReservationNotifications(reservationId: string): Promise<ReservationNotification[]> {
    return await db
      .select()
      .from(reservationNotifications)
      .where(eq(reservationNotifications.reservationId, reservationId))
      .orderBy(desc(reservationNotifications.sentAt));
  }

  // Seat management methods
  async incrementReservedSeats(tourId: string, count: number): Promise<void> {
    await db
      .update(tours)
      .set({ reservedSeats: sql`${tours.reservedSeats} + ${count}` })
      .where(eq(tours.id, tourId));
  }

  async decrementReservedSeats(tourId: string, count: number): Promise<void> {
    await db
      .update(tours)
      .set({ reservedSeats: sql`GREATEST(${tours.reservedSeats} - ${count}, 0)` })
      .where(eq(tours.id, tourId));
  }

  // Reservation automation methods
  async getReservationsForReminders(): Promise<Reservation[]> {
    const now = new Date();
    return await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.paymentStatus, "pending"),
          or(
            eq(reservations.status, "pending"),
            eq(reservations.status, "approved")
          ),
          sql`${reservations.paymentDueDate} > ${now}`
        )
      );
  }

  async getReservationsForCancellation(): Promise<Reservation[]> {
    const now = new Date();
    return await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.paymentStatus, "pending"),
          or(
            eq(reservations.status, "pending"),
            eq(reservations.status, "approved"),
            eq(reservations.status, "vencida")
          ),
          sql`${reservations.paymentDueDate} <= ${now}`
        )
      );
  }

  async updateReservationAutomationFields(
    id: string,
    fields: Partial<Pick<Reservation, 'lastReminderSent' | 'autoCancelAt' | 'status' | 'paymentStatus' | 'adminAlertSent' | 'tripReminderSent'>>
  ): Promise<Reservation | undefined> {
    const result = await db
      .update(reservations)
      .set(fields)
      .where(eq(reservations.id, id))
      .returning();
    return result[0];
  }

  async autoCancelReservationAtomic(reservationId: string, newStatus: string): Promise<Reservation> {
    return await db.transaction(async (tx) => {
      // 1. Obtener y bloquear la reserva
      const reservationResult = await tx
        .select()
        .from(reservations)
        .where(eq(reservations.id, reservationId))
        .for('update');
      
      const reservation = reservationResult[0];
      if (!reservation) {
        throw new Error("Reserva no encontrada");
      }

      // 2. Actualizar estado de la reserva
      const updatedReservationResult = await tx
        .update(reservations)
        .set({ status: newStatus })
        .where(eq(reservations.id, reservationId))
        .returning();
      
      const updatedReservation = updatedReservationResult[0];

      // 3. Si se cancela definitivamente, liberar cupos
      if (newStatus === "cancelada") {
        // Liberar cupos de la salida (si existe)
        if (reservation.departureId) {
          const departureResult = await tx
            .select()
            .from(departures)
            .where(eq(departures.id, reservation.departureId))
            .for('update');
          
          const departure = departureResult[0];
          if (departure) {
            const newReservedSeats = Math.max(0, departure.reservedSeats - reservation.numberOfPassengers);
            await tx
              .update(departures)
              .set({ reservedSeats: newReservedSeats })
              .where(eq(departures.id, reservation.departureId));
          }
        }

        // Liberar cupos del tour (para compatibilidad)
        if (reservation.tourId) {
          const tourResult = await tx
            .select()
            .from(tours)
            .where(eq(tours.id, reservation.tourId))
            .for('update');
          
          const tour = tourResult[0];
          if (tour) {
            const newReservedSeats = Math.max(0, tour.reservedSeats - reservation.numberOfPassengers);
            await tx
              .update(tours)
              .set({ reservedSeats: newReservedSeats })
              .where(eq(tours.id, reservation.tourId));
          }
        }
      }

      return updatedReservation;
    });
  }
  
  // Payment installments methods
  async getPaymentInstallment(id: string): Promise<PaymentInstallment | undefined> {
    const result = await db
      .select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.id, id))
      .limit(1);
    return result[0];
  }

  async getPaymentInstallments(reservationId: string): Promise<PaymentInstallment[]> {
    return await db
      .select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.reservationId, reservationId))
      .orderBy(paymentInstallments.installmentNumber);
  }
  
  async createPaymentInstallment(installment: InsertPaymentInstallment): Promise<PaymentInstallment> {
    // Validar y transformar fechas con el schema
    const validatedInstallment = insertPaymentInstallmentSchema.parse(installment);
    const result = await db.insert(paymentInstallments).values(validatedInstallment).returning();
    return result[0];
  }
  
  async updatePaymentInstallment(id: string, data: Partial<InsertPaymentInstallment>): Promise<PaymentInstallment | undefined> {
    const result = await db
      .update(paymentInstallments)
      .set(data)
      .where(eq(paymentInstallments.id, id))
      .returning();
    return result[0];
  }
  
  async markInstallmentAsPaid(id: string, paidBy: string): Promise<PaymentInstallment | undefined> {
    const result = await db
      .update(paymentInstallments)
      .set({
        status: 'paid',
        paidAt: new Date(),
        paidBy,
      })
      .where(eq(paymentInstallments.id, id))
      .returning();
    return result[0];
  }
  
  async deletePaymentInstallment(id: string): Promise<void> {
    await db.delete(paymentInstallments).where(eq(paymentInstallments.id, id));
  }

  // Generate payment installments for a reservation
  async generatePaymentInstallments(
    reservationId: string,
    totalAmount: number,
    paymentDueDate: Date,
    numberOfInstallments: number = 3
  ): Promise<PaymentInstallment[]> {
    // Obtener configuración de depósito mínimo
    const minDepositSetting = await this.getSetting('MIN_DEPOSIT_PERCENTAGE');
    const minDepositPercentage = minDepositSetting ? parseFloat(minDepositSetting.value) : 30;

    // Calcular depósito inicial (30% por defecto)
    const depositAmount = (totalAmount * minDepositPercentage) / 100;
    const remainingAmount = totalAmount - depositAmount;

    // Calcular monto de cada cuota
    const installmentAmount = remainingAmount / numberOfInstallments;

    const installments: PaymentInstallment[] = [];

    // Crear depósito inicial (cuota 0)
    const depositInstallment = await this.createPaymentInstallment({
      reservationId,
      installmentNumber: 0,
      amountDue: depositAmount.toFixed(2),
      percentageDue: minDepositPercentage,
      dueDate: paymentDueDate,
      status: 'pending',
      description: 'Depósito inicial',
    });
    installments.push(depositInstallment);

    // Calcular porcentaje de cada cuota
    const installmentPercentage = Math.round(((remainingAmount / numberOfInstallments) / totalAmount) * 100);

    // Crear cuotas restantes
    for (let i = 1; i <= numberOfInstallments; i++) {
      // Calcular fecha de vencimiento escalonada (cada 30 días después del depósito inicial)
      const installmentDueDate = new Date(paymentDueDate);
      installmentDueDate.setDate(installmentDueDate.getDate() + (i * 30));

      const installment = await this.createPaymentInstallment({
        reservationId,
        installmentNumber: i,
        amountDue: installmentAmount.toFixed(2),
        percentageDue: installmentPercentage,
        dueDate: installmentDueDate,
        status: 'pending',
        description: `Cuota ${i} de ${numberOfInstallments}`,
      });
      installments.push(installment);
    }

    return installments;
  }
  
  // System config methods
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const result = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key))
      .limit(1);
    return result[0];
  }
  
  async setSystemConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
    const existing = await this.getSystemConfig(key);
    
    if (existing) {
      const result = await db
        .update(systemConfig)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(systemConfig.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(systemConfig)
        .values({ key, value, description })
        .returning();
      return result[0];
    }
  }
  
  async getAllSystemConfigs(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig);
  }
  
  // Timeline events methods
  async createTimelineEvent(event: InsertReservationTimelineEvent): Promise<ReservationTimelineEvent> {
    const result = await db.insert(reservationTimelineEvents).values(event).returning();
    return result[0];
  }
  
  async getTimelineEvents(reservationId: string): Promise<ReservationTimelineEvent[]> {
    return await db
      .select()
      .from(reservationTimelineEvents)
      .where(eq(reservationTimelineEvents.reservationId, reservationId))
      .orderBy(desc(reservationTimelineEvents.createdAt));
  }
  
  // Reports methods
  async getSalesReport(startDate: Date, endDate: Date, tourId?: string, departureId?: string): Promise<SalesReport> {
    const conditions = [
      sql`${reservations.reservationDate} >= ${startDate}`,
      sql`${reservations.reservationDate} <= ${endDate}`,
      or(
        eq(reservations.status, 'confirmed'),
        eq(reservations.status, 'completed')
      )
    ];

    if (tourId) {
      conditions.push(eq(reservations.tourId, tourId));
    }
    if (departureId) {
      conditions.push(eq(reservations.departureId, departureId));
    }

    const results = await db
      .select({
        id: reservations.id,
        tourId: reservations.tourId,
        tourName: tours.title,
        totalPrice: reservations.totalPrice,
        reservationDate: reservations.reservationDate,
        status: reservations.status,
        paymentStatus: reservations.paymentStatus,
      })
      .from(reservations)
      .innerJoin(tours, eq(reservations.tourId, tours.id))
      .where(and(...conditions));

    const totalRevenue = results.reduce((sum, r) => sum + parseFloat(r.totalPrice), 0);
    const totalReservations = results.length;
    const averageOrderValue = totalReservations > 0 ? totalRevenue / totalReservations : 0;

    const tourMap = new Map<string, { tourId: string; tourName: string; revenue: number; count: number }>();
    results.forEach(r => {
      const existing = tourMap.get(r.tourId);
      if (existing) {
        existing.revenue += parseFloat(r.totalPrice);
        existing.count++;
      } else {
        tourMap.set(r.tourId, {
          tourId: r.tourId,
          tourName: r.tourName,
          revenue: parseFloat(r.totalPrice),
          count: 1,
        });
      }
    });

    const monthMap = new Map<string, { revenue: number; count: number }>();
    results.forEach(r => {
      const month = new Date(r.reservationDate).toISOString().substring(0, 7);
      const existing = monthMap.get(month);
      if (existing) {
        existing.revenue += parseFloat(r.totalPrice);
        existing.count++;
      } else {
        monthMap.set(month, {
          revenue: parseFloat(r.totalPrice),
          count: 1,
        });
      }
    });

    return {
      summary: {
        totalRevenue,
        totalReservations,
        averageOrderValue,
      },
      byTour: Array.from(tourMap.values()),
      byMonth: Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      })),
    };
  }

  async getOccupationReport(startDate: Date, endDate: Date, tourId?: string): Promise<OccupationReportItem[]> {
    const conditions = [
      sql`${departures.departureDate} >= ${startDate}`,
      sql`${departures.departureDate} <= ${endDate}`
    ];

    if (tourId) {
      conditions.push(eq(departures.tourId, tourId));
    }

    const results = await db
      .select({
        departureId: departures.id,
        tourId: departures.tourId,
        tourName: tours.title,
        departureDate: departures.departureDate,
        returnDate: departures.returnDate,
        totalSeats: departures.totalSeats,
        reservedSeats: departures.reservedSeats,
      })
      .from(departures)
      .innerJoin(tours, eq(departures.tourId, tours.id))
      .where(and(...conditions))
      .orderBy(departures.departureDate);

    return results.map(r => ({
      departureId: r.departureId,
      tourId: r.tourId,
      tourName: r.tourName,
      departureDate: r.departureDate,
      returnDate: r.returnDate,
      totalSeats: r.totalSeats,
      reservedSeats: r.reservedSeats,
      occupationPercentage: r.totalSeats > 0 ? (r.reservedSeats / r.totalSeats) * 100 : 0,
    }));
  }

  async getReconciliationData(filters?: { startDate?: string; endDate?: string; status?: string; minAmount?: number }): Promise<any[]> {
    let query = db
      .select({
        installment: paymentInstallments,
        reservation: reservations,
        tour: tours,
        departure: departures,
        buyer: users,
      })
      .from(paymentInstallments)
      .leftJoin(reservations, eq(paymentInstallments.reservationId, reservations.id))
      .leftJoin(tours, eq(reservations.tourId, tours.id))
      .leftJoin(departures, eq(reservations.departureId, departures.id))
      .leftJoin(users, eq(reservations.userId, users.id));

    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(paymentInstallments.status, filters.status));
    }

    if (filters?.startDate) {
      conditions.push(gte(paymentInstallments.dueDate, new Date(filters.startDate)));
    }

    if (filters?.endDate) {
      conditions.push(lte(paymentInstallments.dueDate, new Date(filters.endDate)));
    }

    if (filters?.minAmount) {
      conditions.push(gte(sql`CAST(${paymentInstallments.amountDue} AS DECIMAL)`, filters.minAmount));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query.orderBy(paymentInstallments.dueDate);
    return result;
  }

  async getPaymentCalendar(startDate: string, endDate: string): Promise<any[]> {
    const result = await db
      .select({
        installment: paymentInstallments,
        reservation: reservations,
        tour: tours,
        departure: departures,
        buyer: users,
      })
      .from(paymentInstallments)
      .leftJoin(reservations, eq(paymentInstallments.reservationId, reservations.id))
      .leftJoin(tours, eq(reservations.tourId, tours.id))
      .leftJoin(departures, eq(reservations.departureId, departures.id))
      .leftJoin(users, eq(reservations.userId, users.id))
      .where(
        and(
          gte(paymentInstallments.dueDate, new Date(startDate)),
          lte(paymentInstallments.dueDate, new Date(endDate))
        )
      )
      .orderBy(paymentInstallments.dueDate);
    
    return result;
  }

  async getAgingReport(): Promise<AgingReport> {
    const allPayments = await db
      .select({
        reservationId: payments.reservationId,
        amount: payments.amount,
        status: payments.status,
      })
      .from(payments);

    const paymentsByReservation = new Map<string, number>();
    allPayments.forEach(p => {
      if (p.status === 'confirmed') {
        const current = paymentsByReservation.get(p.reservationId) || 0;
        paymentsByReservation.set(p.reservationId, current + parseFloat(p.amount));
      }
    });

    const results = await db
      .select({
        id: reservations.id,
        tourId: reservations.tourId,
        tourName: tours.title,
        buyerName: reservations.buyerName,
        buyerEmail: reservations.buyerEmail,
        totalPrice: reservations.totalPrice,
        paymentDueDate: reservations.paymentDueDate,
        status: reservations.status,
        paymentStatus: reservations.paymentStatus,
      })
      .from(reservations)
      .innerJoin(tours, eq(reservations.tourId, tours.id))
      .where(
        and(
          sql`${reservations.status} != 'cancelled'`,
          sql`${reservations.status} != 'completed'`
        )
      );

    const now = new Date();
    const buckets = {
      current: 0,
      days8to14: 0,
      days15to30: 0,
      overdue: 0,
    };

    const reservationsWithBalance = results
      .map(r => {
        const totalPrice = parseFloat(r.totalPrice);
        const paidAmount = paymentsByReservation.get(r.id) || 0;
        const balanceDue = totalPrice - paidAmount;

        let daysOverdue = 0;
        if (r.paymentDueDate) {
          const diffTime = now.getTime() - r.paymentDueDate.getTime();
          daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        if (balanceDue > 0) {
          if (daysOverdue > 30) {
            buckets.overdue += balanceDue;
          } else if (daysOverdue >= 15) {
            buckets.days15to30 += balanceDue;
          } else if (daysOverdue >= 8) {
            buckets.days8to14 += balanceDue;
          } else {
            buckets.current += balanceDue;
          }
        }

        return {
          id: r.id,
          code: r.id.substring(0, 8).toUpperCase(),
          tourName: r.tourName,
          buyerName: r.buyerName,
          buyerEmail: r.buyerEmail,
          totalPrice,
          balanceDue,
          paymentDueDate: r.paymentDueDate,
          daysOverdue: Math.max(0, daysOverdue),
          status: r.status,
          paymentStatus: r.paymentStatus,
        };
      })
      .filter(r => r.balanceDue > 0)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    return {
      buckets,
      reservations: reservationsWithBalance,
    };
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.templateType);
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
    return result[0];
  }

  async getEmailTemplateByType(templateType: string): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates).where(eq(emailTemplates.templateType, templateType)).limit(1);
    return result[0];
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await db.insert(emailTemplates).values(template).returning();
    return result[0];
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>, userId?: string): Promise<EmailTemplate | undefined> {
    // First, get the current version to save as history
    const currentTemplate = await this.getEmailTemplate(id);
    
    if (currentTemplate) {
      // Count existing versions
      const existingVersions = await db
        .select()
        .from(emailTemplateVersions)
        .where(eq(emailTemplateVersions.templateId, id));
      
      const versionNumber = existingVersions.length + 1;
      
      // Save the current state as a version
      await this.createEmailTemplateVersion({
        templateId: id,
        versionNumber,
        subject: currentTemplate.subject,
        body: currentTemplate.body,
        variables: currentTemplate.variables as any,
        category: currentTemplate.category,
        changedBy: userId,
      });
    }
    
    // Now update the template
    const result = await db
      .update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  async createEmailTemplateVersion(version: InsertEmailTemplateVersion): Promise<EmailTemplateVersion> {
    const result = await db.insert(emailTemplateVersions).values(version).returning();
    return result[0];
  }

  async getEmailTemplateVersions(templateId: string): Promise<EmailTemplateVersion[]> {
    return await db
      .select()
      .from(emailTemplateVersions)
      .where(eq(emailTemplateVersions.templateId, templateId))
      .orderBy(desc(emailTemplateVersions.versionNumber));
  }

  async getReminderRules(): Promise<ReminderRule[]> {
    return await db.select().from(reminderRules).orderBy(reminderRules.daysBeforeDeadline);
  }

  async getReminderRule(id: string): Promise<ReminderRule | undefined> {
    const result = await db.select().from(reminderRules).where(eq(reminderRules.id, id)).limit(1);
    return result[0];
  }

  async createReminderRule(rule: InsertReminderRule): Promise<ReminderRule> {
    const result = await db.insert(reminderRules).values(rule).returning();
    return result[0];
  }

  async updateReminderRule(id: string, rule: Partial<InsertReminderRule>): Promise<ReminderRule | undefined> {
    const result = await db
      .update(reminderRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(reminderRules.id, id))
      .returning();
    return result[0];
  }

  async deleteReminderRule(id: string): Promise<void> {
    await db.delete(reminderRules).where(eq(reminderRules.id, id));
  }

  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const result = await db.insert(emailLogs).values(log).returning();
    return result[0];
  }

  async getEmailLogsByReservation(reservationId: string): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.reservationId, reservationId))
      .orderBy(desc(emailLogs.sentAt));
  }

  async getEmailLog(id: string): Promise<EmailLog | undefined> {
    const result = await db.select().from(emailLogs).where(eq(emailLogs.id, id)).limit(1);
    return result[0];
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAuditLogsByReservation(reservationId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.reservationId, reservationId))
      .orderBy(desc(auditLogs.timestamp));
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.timestamp));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserPermissions(id: string, permissions: string[]): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ permissions })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserRole(id: string, role: string, permissions: string[]): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ role, permissions })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async toggleUserActive(id: string, active: boolean): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ active })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getSettings(category?: string): Promise<SystemSetting[]> {
    if (category) {
      return await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.category, category))
        .orderBy(systemSettings.key);
    }
    return await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.category, systemSettings.key);
  }

  async getSetting(key: string): Promise<SystemSetting | undefined> {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return result[0];
  }

  // Alias for audit middleware compatibility
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    return this.getSetting(key);
  }

  async createSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const result = await db
      .insert(systemSettings)
      .values(setting)
      .returning();
    return result[0];
  }

  async updateSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting | undefined> {
    const result = await db
      .update(systemSettings)
      .set({ value, updatedAt: new Date(), updatedBy })
      .where(eq(systemSettings.key, key))
      .returning();
    return result[0];
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  // Initialize default system settings
  async initializeDefaultSettings(): Promise<void> {
    const existingSettings = await this.getSettings();
    
    // Si ya hay configuraciones, no hacer nada
    if (existingSettings.length > 0) {
      return;
    }

    const defaultSettings: InsertSystemSetting[] = [
      // Configuraciones de pagos
      {
        key: 'MIN_DEPOSIT_PERCENTAGE',
        value: '30',
        category: 'payments',
        description: 'Porcentaje mínimo de depósito inicial requerido',
        dataType: 'number',
      },
      {
        key: 'MAX_INSTALLMENTS_ALLOWED',
        value: '12',
        category: 'payments',
        description: 'Número máximo de cuotas permitidas',
        dataType: 'number',
      },
      {
        key: 'DEFAULT_INSTALLMENTS',
        value: '3',
        category: 'payments',
        description: 'Número de cuotas por defecto para nuevas reservas',
        dataType: 'number',
      },
      {
        key: 'GRACE_DAYS_BEFORE_CANCELLATION',
        value: '1',
        category: 'payments',
        description: 'Días de gracia antes de cancelación automática',
        dataType: 'number',
      },
      {
        key: 'LATE_PAYMENT_SURCHARGE',
        value: '0',
        category: 'payments',
        description: 'Recargo por pago tardío (%)',
        dataType: 'number',
      },
    ];

    for (const setting of defaultSettings) {
      await this.createSetting(setting);
    }

    console.log('[INIT] Configuraciones por defecto inicializadas correctamente');
  }
}

export const storage = new DbStorage();
