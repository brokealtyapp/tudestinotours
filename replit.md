# Tu Destino Tours

## Overview
Tu Destino Tours is a web platform for commercializing and managing tour reservations. It features a modern blue, red, and white branding with distinct Administrator and Client user profiles. The platform provides a complete booking system with **specific departure management**, reservation management, automated payment schedules, and PDF document generation (invoices and itineraries). Its core purpose is to streamline tour sales and management, offering a comprehensive solution for both customers and administrators.

## Recent Changes
- **2024-10-31 (Latest)**: Implemented Reports and Analytics System (FASE 4 completed)
  - **Backend - Storage & Routes**: Created 3 storage methods and REST endpoints:
    - GET /api/reports/sales (filtros: startDate, endDate, tourId?, departureId?)
    - GET /api/reports/occupation (filtros: tourId?)
    - GET /api/reports/aging (sin filtros)
  - **Frontend - Reports Component**: Tab "Reportes" en Admin con 3 sub-tabs:
    - **Tab Ventas**: 3 KPI cards (Ingreso Total, Reservas, Ticket Promedio), tabla por tour con exportación CSV, gráfico de líneas mensual con Recharts
    - **Tab Ocupación**: Tabla de salidas con % ocupación y semáforo de colores (verde >70%, amarillo 40-70%, rojo <40%), gráfico de barras horizontales, exportación CSV
    - **Tab Cuentas por Cobrar**: 4 cards de aging buckets (0-7, 8-14, 15-30, >30 días), tabla de reservas pendientes ordenada por días vencidos, botón enviar recordatorio individual
  - **Filtros completos**: Ventas incluye selector de salidas dinámico (se habilita al seleccionar tour)
  - **Exportación CSV**: Implementada client-side con validación anti-división-por-cero
  - **Visualización**: Recharts para gráficos profesionales, tablas con sorting y data-testids

- **2024-10-31 (Continued)**: Implemented Passport Document Verification System (FASE 3 completed)
  - **Schema & Backend**: Extended `passengers` table with `documentStatus` (pending/approved/rejected) and `documentNotes` fields
  - **API Endpoints**:
    - GET /api/passengers (admin-only endpoint to retrieve all passengers)
    - PUT /api/passengers/:id/document-status (admin-only endpoint to approve/reject documents)
  - **Email Notifications**: Automated email to buyer when document is rejected, requesting correction with detailed reasoning
  - **Timeline Events**: Automatic logging of document status changes (approved/rejected/pending) in reservation timeline
  - **Admin UI - Pasajeros Tab**: Complete passenger table showing all passengers with their data (name, passport, nationality, birthdate, reservation ID, document status, actions)
  - **Admin UI - Documentos Tab**: 
    - Grid view with document previews showing passport images
    - Status badges (pending/approved/rejected) with color coding
    - Quick approve buttons directly from grid
    - Click to view fullscreen modal
  - **Document Verification Modal**:
    - Fullscreen image viewer for detailed passport inspection
    - Passenger information display (passport number, nationality, birthdate, reservation ID)
    - Current status indicator
    - Notes/rejection reason textarea
    - Actions: Approve, Reject with mandatory notes (sends email to buyer)
    - All actions create timeline events for audit trail

- **2024-10-31**: Implemented Departures System (FASE 2A-2B-2C completed)
  - **FASE 2A - Database Schema**: Created `departures` table with full schema: tourId, departureDate, returnDate, totalSeats, reservedSeats, price, supplements (JSONB), cancellationPolicyOverride, paymentDeadlineDays, status. Added `departureId` (nullable) to `reservations` table.
  - **FASE 2B - Backend API**: Implemented 6 storage methods and complete REST API with validations:
    - GET /api/departures (list with optional tourId filter)
    - GET /api/departures/:id (detail)
    - POST /api/departures (create with validations: future dates, seats > 0)
    - PUT /api/departures/:id (update with capacity validation)
    - DELETE /api/departures/:id (prevent deletion if has reservations)
    - POST /api/departures/:id/duplicate (duplicate to multiple dates)
  - **FASE 2C - Admin UI**: Created complete departures management interface:
    - New "Salidas" tab in admin panel with filters (tour, status)
    - Comprehensive table with columns: Tour, Departure/Return dates, Seats (with progress bar), Occupation %, Price, Status, Actions
    - Create/Edit dialog with full form: tour selection, date pickers, seats/price/payment deadline inputs, supplements (JSON), cancellation policy override
    - Duplicate dialog for bulk creation to multiple dates
    - Real-time seat tracking visualization with color-coded occupation percentage
    - Full CRUD operations with proper validations and user feedback

## User Preferences
None documented yet.

## System Architecture

### UI/UX Decisions
The platform utilizes a modern, clean interface with a blue, red, and white color scheme. It incorporates Shadcn UI components for a consistent design, supports responsive design for all screen sizes, and includes dark mode. Accessible form controls with proper validation are prioritized. The entire platform is 100% translated to Spanish.

### Technical Implementations
- **Frontend**: React + TypeScript, Wouter for routing, Shadcn UI, TailwindCSS.
- **Backend**: Express.js, JWT for authentication, Drizzle ORM.
- **Database**: PostgreSQL (Neon).
- **Storage**: Google Cloud Storage for object storage.
- **State Management**: TanStack Query.
- **PDF Generation**: Server-side PDF generation using `@react-pdf/renderer` for invoices and itineraries, branded with Tu Destino Tours.
- **Email Service**: Transactional email service for confirmations, reminders, and cancellations, configurable for simulated or production mode.
- **Scheduler**: `node-cron` for daily and periodic automated tasks, including payment reminders and automatic reservation cancellations.

### Feature Specifications
- **Authentication**: JWT-based with role-based access control (Administrator, Client).
- **Tour Management (Admin)**: CRUD operations for tours, image uploads, setting tour details, search and filter.
- **Departures Management (Admin)**:
    - Create specific departures for tours with individual pricing, dates, and capacity.
    - Manage departure-level supplements (early bird discounts, single room supplements, etc.) stored as JSONB.
    - Override cancellation policies and payment deadlines per departure.
    - Duplicate departures to multiple dates in bulk.
    - Real-time seat tracking (reservedSeats/totalSeats) with automatic updates.
    - Prevent deletion of departures with active reservations.
    - Filter departures by tour and view chronologically.
- **Booking System (Client)**: Multi-step wizard including tour selection, **specific departure selection**, passenger information, passport document uploads, and booking submission.
- **Reservation Management**:
    - State tracking (pending, confirmed, completed, cancelled, overdue).
    - Admin actions: confirm payments, update status.
    - Client actions: view booking history.
    - Automatic total price calculation.
    - Automated payment due date calculation (`departureDate - 30 days`).
    - Automated reservation cancellation for non-payment after 24 hours in "overdue" state.
- **Partial Payment System**:
    - Supports single payment or scheduled installments.
    - Configurable minimum deposit percentage (global or per-tour override).
    - Admin interface to manage installment schedules (create, update, delete, mark as paid).
    - Client dashboard to view payment schedule and external payment links.
    - Manual confirmation of payments by admin.
- **Seat Management**:
    - Automatic seat blocking (`reservedSeats`) upon reservation creation.
    - Automatic seat liberation upon reservation cancellation or expiry.
    - Real-time seat availability and occupancy display for admin.
- **Dashboards**:
    - **Admin Dashboard**: Overview of reservations, tour management, manual payment confirmation.
    - **Client Dashboard**: Personal reservation history, payment schedule.
- **PDF Generation**:
    - Invoices: Detailed financial summaries including payment schedules.
    - Itineraries: Comprehensive travel information, passenger details, tour descriptions, and important notes.
    - Role-based access for document downloads.
- **Timeline Visual de Eventos**:
    - Tracking comprehensivo del ciclo de vida de cada reserva.
    - Registro automático de eventos críticos: creación de reserva, cambios de estado, cambios en estado de pago, creación y pago de cuotas.
    - Visualización cronológica con íconos diferenciados por tipo de evento.
    - Fechas relativas en español (hace X horas/días/semanas).
    - Metadata enriquecida con información del usuario que ejecutó la acción.
    - Visible para admins (en diálogo de gestión de cuotas) y clientes (en detalle de reserva).
    - Tabla `reservation_timeline_events` con campos: eventType, description, performedBy, metadata (JSONB).
- **Reportes y Análisis (Admin)**:
    - Tab "Reportes" con 3 sub-tabs de análisis de negocio.
    - Reporte de Ventas: KPIs financieros, filtros por rango de fechas/tour/salida, tabla detallada por tour, gráfico temporal, exportación CSV.
    - Reporte de Ocupación: Vista de capacidad por salida con % ocupación, semáforo de colores, gráfico de barras, exportación CSV.
    - Reporte de Cuentas por Cobrar: 4 buckets de aging (0-7, 8-14, 15-30, >30 días), tabla de pendientes con días vencidos, envío de recordatorios individuales.
    - Visualización con Recharts para gráficos profesionales.
    - Filtros dinámicos y opcionales para drilldown de información.

### System Design Choices
- **Modular Architecture**: Clear separation between frontend and backend, with distinct services for email, PDF, and object storage.
- **Database Schema**: Extensively designed with tables for users, tours, **departures** (specific tour instances with dates/pricing/capacity), reservations, passengers, payments, payment installments, system configurations, notification logging, and timeline events. Key relationships established for data integrity.
- **Departure-Centric Model**: Shift from "tour + free date" to "select specific departure" enables:
  - Individual pricing per departure (seasonal pricing, early bird discounts).
  - Real-time capacity management at the departure level.
  - Flexible supplements and policies per departure.
  - Better forecasting and occupancy tracking.
- **Event-Driven Tracking**: Sistema de eventos automático que registra todas las acciones importantes en el ciclo de vida de reservas, proporcionando auditoría completa y visibilidad para usuarios y administradores.
- **Backwards Compatibility**: `departureId` is nullable in reservations table to preserve existing data during migration phase.
- **Error Handling**: Comprehensive error messages for both frontend and backend, fully localized in Spanish.

## External Dependencies
- **PostgreSQL (Neon)**: Main database.
- **Google Cloud Storage**: Object storage for tour images and passport documents.
- **Resend**: Transactional email service (optional, if `RESEND_API_KEY` is configured).
- **Mercado Pago, PayPal, etc.**: External payment gateways (integrated via manual links, not direct API integration).