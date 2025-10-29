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
  users,
  tours,
  reservations,
  passengers,
  payments,
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
}

export const storage = new DbStorage();
