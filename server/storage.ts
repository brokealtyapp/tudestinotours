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
  type ReminderRule,
  type InsertReminderRule,
  type EmailLog,
  type InsertEmailLog,
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
  reminderRules,
  emailLogs,
} from "@shared/schema";
import { eq, desc, and, or, ilike, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: string, status: string, paymentStatus?: string): Promise<Reservation | undefined>;
  
  // Passenger methods
  getAllPassengers(): Promise<Passenger[]>;
  getPassengersByReservation(reservationId: string): Promise<Passenger[]>;
  createPassenger(passenger: InsertPassenger): Promise<Passenger>;
  updatePassengerDocumentStatus(id: string, status: string, notes?: string): Promise<Passenger | undefined>;
  
  // Payment methods
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
  updateReservationAutomationFields(id: string, fields: Partial<Pick<Reservation, 'lastReminderSent' | 'autoCancelAt' | 'status' | 'paymentStatus'>>): Promise<Reservation | undefined>;
  
  // Payment installments methods
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
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<void>;
  
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

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
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
    const result = await db.insert(departures).values(departure).returning();
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
  async getReservations(userId?: string): Promise<Reservation[]> {
    if (userId) {
      return await db
        .select()
        .from(reservations)
        .where(eq(reservations.userId, userId))
        .orderBy(desc(reservations.createdAt));
    }
    return await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
    return result[0];
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const result = await db.insert(reservations).values(reservation).returning();
    return result[0];
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
  async getAllPassengers(): Promise<Passenger[]> {
    return await db
      .select()
      .from(passengers)
      .orderBy(desc(passengers.createdAt));
  }

  async getPassengersByReservation(reservationId: string): Promise<Passenger[]> {
    return await db
      .select()
      .from(passengers)
      .where(eq(passengers.reservationId, reservationId));
  }

  async createPassenger(passenger: InsertPassenger): Promise<Passenger> {
    const result = await db.insert(passengers).values(passenger).returning();
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
    fields: Partial<Pick<Reservation, 'lastReminderSent' | 'autoCancelAt' | 'status' | 'paymentStatus'>>
  ): Promise<Reservation | undefined> {
    const result = await db
      .update(reservations)
      .set(fields)
      .where(eq(reservations.id, id))
      .returning();
    return result[0];
  }
  
  // Payment installments methods
  async getPaymentInstallments(reservationId: string): Promise<PaymentInstallment[]> {
    return await db
      .select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.reservationId, reservationId))
      .orderBy(paymentInstallments.installmentNumber);
  }
  
  async createPaymentInstallment(installment: InsertPaymentInstallment): Promise<PaymentInstallment> {
    const result = await db.insert(paymentInstallments).values(installment).returning();
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
      const month = r.reservationDate.toISOString().substring(0, 7);
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

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
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
}

export const storage = new DbStorage();
