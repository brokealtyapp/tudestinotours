import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const timestampDate = (name: string) => timestamp(name, { mode: "date", withTimezone: true });

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("client"),
  permissions: text("permissions").array().notNull().default(sql`ARRAY[]::text[]`),
  active: boolean("active").notNull().default(true),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
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
  discount: integer("discount").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  itinerary: text("itinerary"),
  includes: text("includes").array().default(sql`ARRAY[]::text[]`),
  excludes: text("excludes").array().default(sql`ARRAY[]::text[]`),
  cancellationPolicy: text("cancellation_policy"),
  requirements: text("requirements"),
  faqs: jsonb("faqs"),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
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
  departureDate: timestampDate("departure_date").notNull(),
  returnDate: timestampDate("return_date"),
  totalSeats: integer("total_seats").notNull(),
  reservedSeats: integer("reserved_seats").notNull().default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  supplements: jsonb("supplements"),
  cancellationPolicyOverride: text("cancellation_policy_override"),
  paymentDeadlineDays: integer("payment_deadline_days").notNull().default(30),
  status: text("status").notNull().default("active"),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
});

export const insertDepartureSchema = createInsertSchema(departures)
  .omit({
    id: true,
    createdAt: true,
    reservedSeats: true,
  })
  .extend({
    departureDate: z.coerce.date(),
    returnDate: z.coerce.date().nullable().optional(),
  });

export type InsertDeparture = z.infer<typeof insertDepartureSchema>;
export type Departure = typeof departures.$inferSelect;

export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationCode: text("reservation_code").notNull().unique(),
  tourId: varchar("tour_id").notNull().references(() => tours.id),
  departureId: varchar("departure_id").references(() => departures.id),
  userId: varchar("user_id").references(() => users.id),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerPassportNumber: text("buyer_passport_number"),
  buyerDepartureAirport: text("buyer_departure_airport"),
  buyerNationality: text("buyer_nationality"),
  reservationDate: timestampDate("reservation_date").notNull(),
  departureDate: timestampDate("departure_date").notNull(),
  paymentDueDate: timestampDate("payment_due_date"),
  autoCancelAt: timestampDate("auto_cancel_at"),
  lastReminderSent: integer("last_reminder_sent"),
  adminAlertSent: boolean("admin_alert_sent").default(false),
  tripReminderSent: boolean("trip_reminder_sent").default(false),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentLink: text("payment_link"),
  numberOfPassengers: integer("number_of_passengers").notNull(),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
});

export const insertReservationSchema = createInsertSchema(reservations)
  .omit({
    id: true,
    reservationCode: true,
    createdAt: true,
  })
  .extend({
    reservationDate: z.coerce.date(),
    departureDate: z.coerce.date(),
    paymentDueDate: z.coerce.date().nullable().optional(),
    autoCancelAt: z.coerce.date().nullable().optional(),
    totalPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  });

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

export const passengers = pgTable("passengers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  passportNumber: text("passport_number").notNull(),
  nationality: text("nationality").notNull(),
  dateOfBirth: timestampDate("date_of_birth").notNull(),
  passportImageUrl: text("passport_image_url"),
  documentStatus: text("document_status").notNull().default("pending"),
  documentNotes: text("document_notes"),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
});

export const insertPassengerSchema = createInsertSchema(passengers)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    dateOfBirth: z.coerce.date(),
    passportImageUrl: z.string().nullable().optional(),
    documentNotes: z.string().nullable().optional(),
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
  confirmedAt: timestampDate("confirmed_at"),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
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
  sentAt: timestampDate("sent_at").defaultNow().notNull(),
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
  dueDate: timestampDate("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  paymentLink: text("payment_link"),
  paidAt: timestampDate("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  exchangeRate: real("exchange_rate"),
  receiptUrl: text("receipt_url"),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
});

export const insertPaymentInstallmentSchema = createInsertSchema(paymentInstallments)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    dueDate: z.coerce.date(),
    paidAt: z.coerce.date().nullable().optional(),
  });

export type InsertPaymentInstallment = z.infer<typeof insertPaymentInstallmentSchema>;
export type PaymentInstallment = typeof paymentInstallments.$inferSelect;

export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestampDate("updated_at").defaultNow().notNull(),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
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
  createdAt: timestampDate("created_at").defaultNow().notNull(),
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
  category: text("category").notNull().default("transactional"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
  updatedAt: timestampDate("updated_at").defaultNow().notNull(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export const emailTemplateVersions = pgTable("email_template_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => emailTemplates.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables"),
  category: text("category").notNull(),
  changedBy: varchar("changed_by").references(() => users.id),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
});

export const insertEmailTemplateVersionSchema = createInsertSchema(emailTemplateVersions).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailTemplateVersion = z.infer<typeof insertEmailTemplateVersionSchema>;
export type EmailTemplateVersion = typeof emailTemplateVersions.$inferSelect;

export const reminderRules = pgTable("reminder_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  daysBeforeDeadline: integer("days_before_deadline").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  templateType: text("template_type").notNull(),
  sendTime: text("send_time").notNull().default("09:00"),
  createdAt: timestampDate("created_at").defaultNow().notNull(),
  updatedAt: timestampDate("updated_at").defaultNow().notNull(),
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
  sentAt: timestampDate("sent_at").defaultNow().notNull(),
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
  timestamp: timestampDate("timestamp").defaultNow().notNull(),
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
  updatedAt: timestampDate("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
