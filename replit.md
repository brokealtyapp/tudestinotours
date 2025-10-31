# Tu Destino Tours

## Overview
Tu Destino Tours is a web platform for commercializing and managing tour reservations. It features a modern blue, red, and white branding with distinct Administrator and Client user profiles. The platform provides a complete booking system with specific departure management, reservation management, automated payment schedules, and PDF document generation (invoices and itineraries). Its core purpose is to streamline tour sales and management, offering a comprehensive solution for both customers and administrators. The project aims to provide a complete solution for tour sales and management, targeting market potential in the travel industry by offering efficiency and a modern user experience.

## User Preferences
None documented yet.

## System Architecture

### UI/UX Decisions
The platform utilizes a modern, clean interface with a blue, red, and white color scheme, incorporating Shadcn UI components for a consistent design. It supports responsive design, includes dark mode, prioritizes accessible form controls with proper validation, and is 100% translated to Spanish.

### Technical Implementations
- **Frontend**: React + TypeScript, Wouter for routing, Shadcn UI, TailwindCSS.
- **Backend**: Express.js, JWT for authentication, Drizzle ORM.
- **Database**: PostgreSQL (Neon).
- **Storage**: Google Cloud Storage for object storage.
- **State Management**: TanStack Query.
- **PDF Generation**: Server-side PDF generation using `@react-pdf/renderer` for branded invoices and itineraries.
- **Email Service**: SMTP-based transactional email service using nodemailer for confirmations, reminders, and cancellations. Configurable via environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM).
- **Scheduler**: `node-cron` for daily and periodic automated tasks with dynamic rule-based configuration from database.

### Feature Specifications
- **Authentication**: JWT-based with role-based access control (Administrator, Client).
- **Tour Management (Admin)**: CRUD for tours, image uploads, details, search, and filter.
- **Departures Management (Admin)**: Create, manage, and duplicate specific tour departures with individual pricing, dates, capacity, supplements (JSONB), cancellation policy overrides, and payment deadlines. Includes real-time seat tracking and prevents deletion of departures with active reservations.
- **Booking System (Client)**: Multi-step wizard for tour and specific departure selection, passenger information, passport document uploads, and booking submission.
- **Reservation Management**: Tracks reservation states (pending, confirmed, completed, cancelled, overdue), automates payment due date calculations, and handles automatic cancellations for non-payment.
- **Partial Payment System**: Supports single or scheduled installments, configurable minimum deposit, admin installment management, and client payment schedule viewing with external payment links.
- **Seat Management**: Automatic seat blocking and liberation, real-time availability display.
- **Dashboards**: Admin dashboard for overview, tour management, and payment confirmation; Client dashboard for reservation history and payment schedules.
- **PDF Generation**: Invoices and itineraries with detailed financial summaries, travel information, and role-based access.
- **Timeline Visual de Eventos**: Comprehensive, automated event tracking for the reservation lifecycle, including creation, status changes, payment updates, and installment management, displayed chronologically with user metadata.
- **Reportes y Análisis (Admin)**: Business analysis reports including Sales (KPIs, detailed table, temporal graph, CSV export), Occupation (capacity view, color-coded occupancy, bar chart, CSV export), and Accounts Receivable (aging buckets, pending reservations, individual reminders).
- **Sistema de Gestión de Pagos Avanzado (Admin)**: Centralized "Conciliación" view for installments with filtering, bulk actions, and CSV export. A "Calendario" view provides a monthly calendar with visual indicators for payments due. Enhanced offline payment recording with detailed metadata.
- **Editor de Plantillas de Email (Admin)**: Full CRUD for email templates, supports placeholders, real-time preview, and various template types (confirmation, reminder, cancellation, etc.).
- **Sistema de Recordatorios Configurables (Admin)**: Database-driven reminder rules system with configurable days before deadline, send time (with 60-minute window and midnight wraparound support), template selection, and enable/disable toggles. Default rules created automatically (7, 3, 0 days before deadline).
- **Historial de Comunicaciones (Admin)**: Complete email audit trail tracking all emails sent by the system, including template type, status, timestamps, and error messages. Includes resend functionality for failed or successful emails.
- **Passport Document Verification System (Admin)**: Management of passenger document status (pending/approved/rejected) with admin UI, automated email notifications for rejections, and timeline event logging.

### System Design Choices
- **Modular Architecture**: Clear separation between frontend and backend, with distinct services.
- **Database Schema**: Extensively designed for users, tours, departures, reservations, passengers, payments, payment installments, system configurations, notifications, timeline events, email templates, reminder rules, and email logs, with key relationships for data integrity.
- **Departure-Centric Model**: Enables individual pricing, real-time capacity management, flexible supplements, and policies at the departure level.
- **Event-Driven Tracking**: Automatic event system for comprehensive auditing and visibility of reservation lifecycle actions.
- **Error Handling**: Comprehensive and localized error messages.

## External Dependencies
- **PostgreSQL (Neon)**: Main database.
- **Google Cloud Storage**: Object storage for tour images and passport documents.
- **SMTP Server**: Email delivery via nodemailer (configurable SMTP provider).
- **Mercado Pago, PayPal, etc.**: External payment gateways (integrated via manual links).

## Recent Updates (October 31, 2025)

### FASE 6B - Sistema de Recordatorios Configurables
- **reminder_rules Table**: Stores configurable reminder rules with daysBeforeDeadline, enabled status, templateType, and sendTime
- **Dynamic Scheduler**: Modified scheduler to load rules from database instead of hardcoded thresholds
- **Time Window Logic**: Implements 60-minute send window with proper midnight wraparound handling using circular distance calculation
- **Duplicate Prevention**: Tracks lastReminderSent on reservations to prevent duplicate reminders
- **Admin UI**: ReminderConfig.tsx component integrated as subtab in Plantillas section
- **Default Rules**: Automatically creates default rules (7, 3, 0 days before deadline) on first startup

### FASE 6C - Historial de Comunicaciones
- **email_logs Table**: Complete audit trail of all emails sent by the system
- **Auto-Logging**: SMTP service automatically logs every email attempt with status, subject, body, and error messages
- **Timeline Integration**: Email events tracked in reservation timeline
- **Admin UI**: EmailCommunications.tsx component shows chronological email history with status badges
- **Resend Functionality**: Admin can resend any email from history with POST /api/email-logs/:id/resend
- **Integration**: Displayed as "Comunicaciones" tab in reservation management dialog

### FASE 7A - Sistema de Auditoría Completa
- **audit_logs Table**: Comprehensive audit trail for all entity changes (tours, departures, reservations, passengers, payments, installments, templates, users, settings)
- **Audit Middleware**: Transparent middleware in auditMiddleware.ts intercepts all POST/PUT/PATCH/DELETE requests
- **Before/After Tracking**: Captures complete state before and after modifications with detailed field-level diffs
- **Entity Support**: Full coverage for all entities via ROUTE_ENTITY_MAP with intelligent ID extraction for nested routes
- **Action Types**: Tracks created, updated, and deleted actions with proper change detection
- **Admin UI**: AuditLog.tsx component displays chronological timeline with color-coded actions and expandable change details
- **Integration**: Displayed as "Auditoría" tab in reservation management dialog
- **User Metadata**: Every audit entry includes userId for accountability and traceability

### FASE 7B - Gestión de Usuarios y Roles (RBAC)
- **Extended users Table**: Added permissions (text[]) and active (boolean) fields for granular access control
- **Role System**: 5 predefined roles (super_admin, admin, manager, agent, client) with associated permission sets
- **Permission System**: 7 granular permissions (manage_users, manage_tours, manage_departures, manage_reservations, manage_payments, view_reports, manage_settings)
- **RBAC Middleware**: requirePermission middleware in auth.ts enforces permission-based access control
- **Role-Permission Mapping**: ROLE_PERMISSIONS in server/permissions.ts defines permission sets for each role
- **User Management API**: Complete CRUD endpoints at /api/admin/users/* for user administration
- **Role Assignment**: Admin can modify user roles which automatically updates permissions
- **Active Status**: Toggle user active/inactive status to temporarily disable accounts
- **Admin UI**: UserManagement.tsx component with role badges, permission counts, and inline editing
- **Integration**: Displayed as "Usuarios" subtab under Configuración section

### FASE 7C - Configuración del Sistema
- **system_settings Table**: Flexible key-value JSONB storage for system-wide configurations
- **Categorization**: Settings organized by category (general, email, payments, reservations, notifications)
- **Data Types**: Support for string, number, boolean, and JSON data types
- **Settings API**: Full CRUD endpoints at /api/settings/* with category filtering
- **Audit Trail**: Tracks updatedBy and updatedAt for all setting changes
- **Admin UI**: SystemSettings.tsx component with category filtering, inline editing, and detailed metadata display
- **Integration**: Displayed as "Sistema" subtab under Configuración section
- **Organization**: Configuración tab reorganized with subtabs (Pagos, Usuarios, Sistema)