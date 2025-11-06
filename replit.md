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
- **Email Service**: SMTP-based transactional email service using nodemailer with 11 comprehensive email types (8 for clients, 3 for admins). Includes automated delivery for reservations, payments, documents, and administrative alerts.
- **Scheduler**: `node-cron` for daily and periodic automated tasks including payment reminders, auto-cancellations, admin alerts for expiring reservations, and trip reminders for upcoming departures.
- **Date Handling**: All timestamp columns use `{ mode: "date", withTimezone: true }` to ensure Drizzle returns proper JavaScript Date objects instead of strings, preventing "value.toISOString is not a function" errors.

### Feature Specifications
- **Authentication**: JWT-based with role-based access control (Administrator, Client). Login rejects inactive users, and tokens of deactivated users are rejected.
- **Tour Management (Admin)**: CRUD for tours with comprehensive filtering, dynamic sorting, real-time validations, visual badges (COMPLETO, CASI LLENO), detailed modal views, and contextual empty states. Prevents deletion of tours with active departures.
- **Departures Management (Admin)**: Create, manage, and duplicate tour departures with individual pricing, dates, capacity, flexible deposit configuration (percentage OR fixed amount), supplements, cancellation policy overrides, and payment deadlines. Includes real-time seat tracking and prevents deletion of departures with active reservations. **Pricing and capacity are managed exclusively at the departure level** - tour-level prices/seats are informational only.
- **Booking System (Client)**: Multi-step wizard for tour/departure selection, passenger info, passport uploads, and booking submission.
- **Reservation Management**: Tracks reservation states, automates payment due dates, and handles automatic cancellations for non-payment. Implements atomic transactions for creating and canceling reservations to prevent overbooking and ensure data consistency.
- **Partial Payment System**: Supports single or scheduled installments with client-selectable frequency (weekly/biweekly/monthly), flexible deposit configuration per departure (percentage OR fixed amount), admin installment management, and client payment schedule viewing. Enforces full payment deadline (configurable days before trip departure).
- **Seat Management**: Automatic seat blocking and liberation, real-time availability display.
- **Dashboards**: Admin dashboard for overview, tour management, and payment confirmation; Client dashboard for reservation history and payment schedules.
- **PDF Generation**: Invoices and itineraries with detailed financial summaries and travel information.
- **Timeline Visual de Eventos**: Comprehensive, automated event tracking for the reservation lifecycle.
- **Reportes y Análisis (Admin)**: Business analysis reports including Sales, Occupation, and Accounts Receivable.
- **Sistema de Gestión de Pagos Avanzado (Admin)**: Centralized "Conciliación" view for installments, "Calendario" view for payments due, and enhanced offline payment recording.
- **Editor de Plantillas de Email (Admin)**: Full CRUD for email templates, supporting placeholders and real-time preview.
- **Sistema de Emails Expandido**: 11 tipos de emails automatizados:
  - **Emails para Clientes (8)**: Confirmación de reserva, recordatorio de pago, cancelación, rechazo de documento, aprobación de documento, pago confirmado con itinerario, bienvenida con credenciales, recordatorio de viaje próximo
  - **Emails para Administradores (3)**: Nueva reserva recibida, documento subido para revisión, alerta de reserva por vencer
  - **Automatización**: Integrados en flujos de reservas, pagos, documentos, y scheduler jobs para envío programado
  - **Plantillas Profesionales**: HTML responsive con branding azul/rojo/blanco, variables dinámicas, y contenido personalizado
- **Sistema de Recordatorios Configurables (Admin)**: Database-driven reminder rules system with configurable days before deadline, send times, template selection, and enable/disable toggles. Prevents duplicate reminders.
- **Historial de Comunicaciones (Admin)**: Complete email audit trail tracking all system-sent emails, including status, timestamps, and error messages, with resend functionality. Integrated into reservation timeline.
- **Passport Document Verification System (Admin)**: Management of passenger document status with admin UI, automated email notifications for rejections, and timeline event logging.
- **Sistema de Auditoría Completa**: Comprehensive audit trail for all entity changes (CRUD operations) with before/after state tracking and user metadata, visible via an "Auditoría" tab.
- **Gestión de Usuarios y Roles (RBAC)**: Extended user management with permissions and active status. Five predefined roles with granular permissions enforced by middleware.
- **Configuración del Sistema**: Flexible key-value JSONB storage for system-wide configurations, categorized and managed via CRUD API, with audit trails for changes.

### System Design Choices
- **Modular Architecture**: Clear separation between frontend and backend.
- **Database Schema**: Extensively designed for various entities like users, tours, departures, reservations, payments, and system configurations.
- **Departure-Centric Model**: All operational data (pricing, capacity, deposit rules) managed exclusively at departure level. Each departure can have:
  - **Independent Pricing**: Per-departure price overrides tour base price
  - **Flexible Deposits**: Choose between percentage-based (e.g., 20% of total) OR fixed amount (e.g., $500) deposit per departure
  - **Capacity Management**: Real-time seat tracking at departure level, not tour level
  - **Payment Scheduling**: Client selects installment frequency (weekly/biweekly/monthly) during booking
  - **Payment Deadlines**: Configurable full-payment deadline (default: 30 days before departure date)
- **Event-Driven Tracking**: Automatic event system for comprehensive auditing and visibility of reservation lifecycle actions.
- **Error Handling**: Comprehensive and localized error messages.
- **Atomic Transactions**: Implemented for critical operations like reservation creation and cancellation to ensure data integrity and prevent race conditions.

## External Dependencies
- **PostgreSQL (Neon)**: Main database.
- **Google Cloud Storage**: Object storage for tour images and passport documents.
- **SMTP Server**: Email delivery via nodemailer (configurable SMTP provider).
- **Mercado Pago, PayPal, etc.**: External payment gateways (integrated via manual links).