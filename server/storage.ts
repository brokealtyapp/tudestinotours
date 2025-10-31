import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Tour,
  type InsertTour,
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
  users,
  tours,
  reservations,
  passengers,
  payments,
  reservationNotifications,
  paymentInstallments,
  systemConfig,
  reservationTimelineEvents,
} from "@shared/schema";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

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
  
  // Reservation methods
  getReservations(userId?: string): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: string, status: string, paymentStatus?: string): Promise<Reservation | undefined>;
  
  // Passenger methods
  getPassengersByReservation(reservationId: string): Promise<Passenger[]>;
  createPassenger(passenger: InsertPassenger): Promise<Passenger>;
  
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
}

export const storage = new DbStorage();
