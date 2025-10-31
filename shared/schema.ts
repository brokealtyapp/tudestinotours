import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("client"),
  permissions: text("permissions").array().notNull().default(sql`ARRAY[]::text[]`),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const tours = pgTable("tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: text("duration").notNull(),
  maxPassengers: integer("max_passengers").notNull(),
  reservedSeats: integer("reserved_seats").notNull().default(0),
  minDepositPercentage: integer("min_deposit_percentage"),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  featured: boolean("featured").notNull().default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
});

export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof tours.$inferSelect;

export const departures = pgTable("departures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull().references(() => tours.id),
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date"),
  totalSeats: integer("total_seats").notNull(),
  reservedSeats: integer("reserved_seats").notNull().default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  supplements: jsonb("supplements"),
  cancellationPolicyOverride: text("cancellation_policy_override"),
  paymentDeadlineDays: integer("payment_deadline_days").notNull().default(30),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDepartureSchema = createInsertSchema(departures).omit({
  id: true,
  createdAt: true,
  reservedSeats: true,
});

export type InsertDeparture = z.infer<typeof insertDepartureSchema>;
export type Departure = typeof departures.$inferSelect;

export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull().references(() => tours.id),
  departureId: varchar("departure_id").references(() => departures.id),
  userId: varchar("user_id").references(() => users.id),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerName: text("buyer_name").notNull(),
  reservationDate: timestamp("reservation_date").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  paymentDueDate: timestamp("payment_due_date"),
  autoCancelAt: timestamp("auto_cancel_at"),
  lastReminderSent: integer("last_reminder_sent"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentLink: text("payment_link"),
  numberOfPassengers: integer("number_of_passengers").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
});

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

export const passengers = pgTable("passengers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  passportNumber: text("passport_number").notNull(),
  nationality: text("nationality").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  passportImageUrl: text("passport_image_url"),
  documentStatus: text("document_status").notNull().default("pending"),
  documentNotes: text("document_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPassengerSchema = createInsertSchema(passengers).omit({
  id: true,
  createdAt: true,
});

export type InsertPassenger = z.infer<typeof insertPassengerSchema>;
export type Passenger = typeof passengers.$inferSelect;

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentLink: text("payment_link"),
  confirmedBy: varchar("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const reservationNotifications = pgTable("reservation_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(),
  daysBeforeDeparture: integer("days_before_departure"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  emailStatus: text("email_status").notNull().default("sent"),
  errorMessage: text("error_message"),
});

export const insertReservationNotificationSchema = createInsertSchema(reservationNotifications).omit({
  id: true,
  sentAt: true,
});

export type InsertReservationNotification = z.infer<typeof insertReservationNotificationSchema>;
export type ReservationNotification = typeof reservationNotifications.$inferSelect;

export const paymentInstallments = pgTable("payment_installments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  installmentNumber: integer("installment_number").notNull(),
  description: text("description").notNull(),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
  percentageDue: integer("percentage_due").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  paymentLink: text("payment_link"),
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  exchangeRate: real("exchange_rate"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentInstallmentSchema = createInsertSchema(paymentInstallments).omit({
  id: true,
  createdAt: true,
});

export type InsertPaymentInstallment = z.infer<typeof insertPaymentInstallmentSchema>;
export type PaymentInstallment = typeof paymentInstallments.$inferSelect;

export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;

export const reservationTimelineEvents = pgTable("reservation_timeline_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  performedBy: varchar("performed_by").references(() => users.id),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReservationTimelineEventSchema = createInsertSchema(reservationTimelineEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertReservationTimelineEvent = z.infer<typeof insertReservationTimelineEventSchema>;
export type ReservationTimelineEvent = typeof reservationTimelineEvents.$inferSelect;

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateType: text("template_type").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export const reminderRules = pgTable("reminder_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  daysBeforeDeadline: integer("days_before_deadline").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  templateType: text("template_type").notNull(),
  sendTime: text("send_time").notNull().default("09:00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReminderRuleSchema = createInsertSchema(reminderRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReminderRule = z.infer<typeof insertReminderRuleSchema>;
export type ReminderRule = typeof reminderRules.$inferSelect;

export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").references(() => reservations.id, { onDelete: "cascade" }),
  templateType: text("template_type").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  recipientEmail: text("recipient_email").notNull(),
  status: text("status").notNull().default("sent"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  errorMessage: text("error_message"),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  reservationId: varchar("reservation_id").references(() => reservations.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  changes: jsonb("changes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  dataType: text("data_type").notNull().default("string"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
