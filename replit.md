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

## Recent Changes (October 29, 2025)
- ✅ Fixed passport upload normalization with new `/api/objects/normalize` endpoint
- ✅ Booking wizard now properly uploads and stores passport documents
- ✅ Client users can normalize uploaded files without admin privileges
- ✅ Complete end-to-end booking flow validated by architect review
- ✅ **Platform fully translated to Spanish** - All pages, components, forms, validation messages, and notifications are now in Spanish

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
- **tours**: Tour information and availability
- **reservations**: Booking records with state tracking
- **passengers**: Individual passenger details linked to reservations

### Key Relationships
- Users (1) → Reservations (N)
- Tours (1) → Reservations (N)
- Reservations (1) → Passengers (N)

## Design Guidelines
- Blue, red, and white color scheme
- Modern, clean interface with Shadcn UI components
- Responsive design for all screen sizes
- Accessible form controls with proper validation
- Dark mode support throughout

## User Preferences
None documented yet.

## Known Limitations
- Email notifications not yet implemented (optional for MVP)
- Payment processing is manual via external links (not integrated gateway)
- Search functionality focuses only on tours (not reservations)

## Future Enhancements
1. Automated email notifications for booking confirmations and payment updates
2. Integrated payment gateway (Stripe, PayPal, etc.)
3. Advanced analytics and reporting for administrators
4. Multi-language support
5. Mobile application
