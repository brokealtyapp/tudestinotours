# Tu Destino Tours

## Overview
Tu Destino Tours is a comprehensive web platform for commercializing and managing tour reservations. The platform features a modern blue, red, and white branding with two distinct user profiles (Administrator and Client), providing a complete booking and reservation management system.

## Project Status
**Current State**: MVP Complete ✓

All core features have been implemented and tested:
- JWT authentication with role-based access control
- Multi-step booking wizard with passport document uploads
- Tour management with object storage integration
- Reservation state tracking and payment processing
- Admin and client dashboards

## Recent Changes (October 31, 2025)
- ✅ **Automatizaciones Críticas Implementadas** - Sistema completo de automatización:
  - Sistema de emails transaccionales (confirmación, recordatorios, itinerarios, cancelaciones)
  - Recordatorios automáticos de pago (60/45/30/21/14/7/3 días antes)
  - Cancelación automática por impago (vencida → cancelada tras 24h)
  - Cálculo automático de fecha límite de pago (salida - 30 días)
  - Bloqueo y liberación automática de cupos
  - Scheduler con node-cron (diario 8AM/9AM + cada 6 horas)
  - Panel de administrador actualizado con cupos y fechas límite
- ✅ Schema extendido: reservedSeats, departureDate, paymentDueDate, autoCancelAt, lastReminderSent, reservation_notifications
- ✅ Email service con modo simulado (RESEND_API_KEY opcional para producción)

## Previous Changes (October 29, 2025)
- ✅ Fixed passport upload normalization with new `/api/objects/normalize` endpoint
- ✅ Booking wizard now properly uploads and stores passport documents
- ✅ Client users can normalize uploaded files without admin privileges
- ✅ Complete end-to-end booking flow validated by architect review
- ✅ **Platform 100% translated to Spanish** - Complete translation including:
  - All UI pages, components, forms, validation messages, and notifications
  - All backend error messages (authentication, tours, reservations, payments)
  - All console logging messages
  - Frontend components: TourCard ("/Persona"), ExploreDestinations (categories, buttons)
  - 20+ backend error messages in server/routes.ts
  - Verified by architect review: Zero English text remaining

## Architecture

### Technology Stack
- **Frontend**: React + TypeScript, Wouter routing, Shadcn UI, TailwindCSS
- **Backend**: Express.js, JWT authentication, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Storage**: Google Cloud Storage (Object Storage)
- **State Management**: TanStack Query

### User Roles
1. **Administrator**: Full access to tour management, reservation management, and payment confirmation
2. **Client**: Can browse tours, create bookings, and view their reservation history

### Key Features

#### Authentication System
- JWT-based authentication with role-based access control
- Secure registration and login for both Admin and Client users
- Session persistence with automatic token refresh

#### Tour Management (Admin)
- Create, read, update, and delete tours
- Upload tour images to object storage
- Set tour details: name, description, price, duration, location, dates
- Search and filter tours by name, location, or date

#### Booking System (Client)
- **Step 1**: Browse and select tour with date selection
- **Step 2**: Enter passenger information (name, ID, phone, email)
- **Step 3**: Upload passport documents for each passenger
- **Step 4**: Review booking and submit with external payment link

#### Reservation Management
- State tracking: pending, confirmed, completed, cancelled
- Admin can confirm payments and update reservation status
- Clients can view their booking history with payment status
- Automatic calculation of total prices based on passenger count

#### Dashboards
- **Admin Dashboard**: Overview of all reservations, tour management, manual payment confirmation
- **Client Dashboard**: Personal reservation history with status tracking

## Project Structure

### Key Files
- `shared/schema.ts`: Database schema and type definitions
- `server/routes.ts`: API endpoints and route handlers
- `server/auth.ts`: JWT authentication middleware
- `server/storage.ts`: Data persistence layer (PostgreSQL)
- `server/objectStorage.ts`: Object storage integration for file uploads
- `client/src/pages/Admin.tsx`: Administrator dashboard
- `client/src/pages/Dashboard.tsx`: Client reservation history
- `client/src/pages/Booking.tsx`: Multi-step booking wizard
- `client/src/pages/TourDetail.tsx`: Individual tour details

### API Endpoints

#### Authentication
- `POST /api/auth/register`: Create new user account
- `POST /api/auth/login`: Authenticate user and receive JWT token
- `GET /api/auth/me`: Get current user information

#### Tours
- `GET /api/tours`: List all tours with optional search/filter
- `GET /api/tours/:id`: Get specific tour details
- `POST /api/tours`: Create new tour (admin only)
- `PUT /api/tours/:id`: Update tour (admin only)
- `DELETE /api/tours/:id`: Delete tour (admin only)
- `POST /api/tours/images`: Normalize tour image URLs (admin only)

#### Reservations
- `GET /api/reservations`: List reservations (all for admin, user's own for clients)
- `POST /api/reservations`: Create new reservation
- `PUT /api/reservations/:id/status`: Update reservation status (admin only)
- `PUT /api/reservations/:id/payment`: Confirm payment (admin only)

#### Object Storage
- `POST /api/objects/upload`: Get signed upload URL for file uploads
- `POST /api/objects/normalize`: Normalize uploaded file URLs (authenticated users)
- `GET /objects/:path`: Retrieve uploaded files

## Database Schema

### Tables
- **users**: User accounts with role-based access
- **tours**: Tour information, availability, and seat tracking
  - New fields: `reservedSeats` (tracking de cupos ocupados)
- **reservations**: Booking records with state tracking and automation fields
  - New fields: `departureDate`, `paymentDueDate`, `autoCancelAt`, `lastReminderSent`
  - States: pending, approved, confirmed, completed, cancelled, cancelada, vencida
- **passengers**: Individual passenger details linked to reservations
- **payments**: Payment tracking linked to reservations
- **reservation_notifications**: Email notification audit trail
  - Tracks all emails sent (confirmations, reminders, cancellations)

### Key Relationships
- Users (1) → Reservations (N)
- Tours (1) → Reservations (N)
- Reservations (1) → Passengers (N)
- Reservations (1) → Payments (N)
- Reservations (1) → ReservationNotifications (N)

## Design Guidelines
- Blue, red, and white color scheme
- Modern, clean interface with Shadcn UI components
- Responsive design for all screen sizes
- Accessible form controls with proper validation
- Dark mode support throughout

## User Preferences
None documented yet.

## Automatizaciones Implementadas

### Sistema de Emails Transaccionales
El sistema utiliza el servicio `server/services/emailService.ts` que:
- Funciona en modo simulado por defecto (logs en consola)
- Puede activarse con producción configurando `RESEND_API_KEY` y `FROM_EMAIL`
- Plantillas HTML completas en español:
  - **Confirmación de reserva**: Enviado al crear reserva, incluye detalles y fecha límite
  - **Recordatorio de pago**: Enviado en umbrales específicos (60/45/30/21/14/7/3 días)
  - **Notificación de vencimiento**: Enviado cuando reserva pasa a estado "vencida"
  - **Notificación de cancelación**: Enviado cuando reserva es cancelada automáticamente
  - **Itinerario confirmado**: Enviado cuando el pago es confirmado

### Cronograma de Recordatorios
El scheduler (`server/jobs/scheduler.ts`) ejecuta:
- **Diariamente a las 8:00 AM**: Procesamiento de recordatorios de pago
- **Diariamente a las 9:00 AM**: Procesamiento de cancelaciones automáticas
- **Cada 6 horas**: Ejecución adicional de ambos jobs para mayor responsiveness

**Umbrales de recordatorio**: 60, 45, 30, 21, 14, 7, 3 días antes de la fecha límite
- Tracking con `lastReminderSent` para evitar duplicados
- Registro en tabla `reservation_notifications` para auditoría

### Lógica de Cancelación Automática
1. **Fecha límite**: Calculada automáticamente como `departureDate - 30 días`
2. **Estado "vencida"**: Reserva marcada cuando llega fecha límite sin pago
3. **Estado "cancelada"**: Aplicado 24 horas después si no se paga
4. **Liberación de cupos**: Automática al cancelar, revierte `reservedSeats`

### Sistema de Cupos
- **Validación en creación**: Verifica `reservedSeats + numberOfPassengers <= maxPassengers`
- **Bloqueo atómico**: Incrementa `reservedSeats` al crear reserva
- **Liberación**: Decrementa `reservedSeats` al cancelar/vencer reserva
- **Panel Admin**: Muestra cupos disponibles, ocupación % con colores (verde/amarillo/rojo)

## Configuración de Emails (Opcional)

Para activar el envío real de emails:
1. Obtener API key de Resend (https://resend.com)
2. Configurar secrets en Replit:
   - `RESEND_API_KEY`: Tu API key de Resend
   - `FROM_EMAIL`: Email verificado para envío (ej: noreply@tudestino.tours)
3. El sistema detectará automáticamente la configuración y enviará emails reales

## Known Limitations
- Payment processing is manual via external links (not integrated gateway)
- Search functionality focuses only on tours (not reservations)
- Concurrent reservation handling tested but may need load testing for high volume

## Future Enhancements
1. Integrated payment gateway (Stripe, PayPal, etc.) with automatic confirmation
2. Advanced analytics and reporting for administrators
3. WhatsApp notifications (complemento a emails)
4. Multi-language support
5. Mobile application
