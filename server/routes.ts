import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  generateToken,
  hashPassword,
  comparePasswords,
  authenticateToken,
  requireAdmin,
  type AuthRequest,
} from "./auth";
import {
  insertUserSchema,
  insertTourSchema,
  insertDepartureSchema,
  insertReservationSchema,
  insertPassengerSchema,
  insertPaymentSchema,
  insertPaymentInstallmentSchema,
} from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { generateInvoicePDF, generateItineraryPDF } from "./services/pdfService";
import { captureBeforeState, createAuditLog } from "./middleware/auditMiddleware";
import { smtpService } from "./services/smtpService";
import { PERMISSIONS, getPermissionsForRole } from "./permissions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply audit middleware globally for all API routes
  app.use('/api', captureBeforeState, createAuditLog);

  // Object storage routes
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error: any) {
      console.error("Error buscando objeto público:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error verificando acceso al objeto:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Allow unauthenticated uploads for anonymous bookings
  app.post("/api/objects/upload", async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error obteniendo URL de carga:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tours/images", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      if (!req.body.imageURL) {
        return res.status(400).json({ error: "imageURL es requerido" });
      }
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.imageURL,
      );
      res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error normalizando ruta de imagen:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Allow unauthenticated normalization for anonymous bookings
  app.post("/api/objects/normalize", async (req: Request, res: Response) => {
    try {
      if (!req.body.imageURL) {
        return res.status(400).json({ error: "imageURL es requerido" });
      }
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.imageURL,
      );
      res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error normalizando ruta de objeto:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Ya existe un usuario con este correo electrónico" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "El correo electrónico y la contraseña son requeridos" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Verify user is active
      if (!user.active) {
        return res.status(403).json({ error: "Esta cuenta ha sido desactivada. Contacte al administrador." });
      }

      // Verify password
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/kpis", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const reservations = await storage.getReservations();
      const tours = await storage.searchTours();

      // Calculate GMV (Gross Merchandise Value) - suma de reservas confirmadas y pagadas
      const gmv = reservations
        .filter(r => r.status === "confirmed" || r.status === "completed" || r.paymentStatus === "completed")
        .reduce((sum, r) => sum + parseFloat(r.totalPrice.toString()), 0);

      // Count reservations by status
      const reservationsByStatus = {
        pending: reservations.filter(r => r.status === "pending").length,
        approved: reservations.filter(r => r.status === "approved").length,
        confirmed: reservations.filter(r => r.status === "confirmed").length,
        completed: reservations.filter(r => r.status === "completed").length,
        cancelled: reservations.filter(r => r.status === "cancelled").length,
        overdue: reservations.filter(r => r.status === "overdue").length,
      };

      // Calculate average occupation
      const totalSeats = tours.reduce((sum, t) => sum + (t.maxPassengers || 0), 0);
      const reservedSeats = tours.reduce((sum, t) => sum + (t.reservedSeats || 0), 0);
      const averageOccupation = totalSeats > 0 ? (reservedSeats / totalSeats) * 100 : 0;

      // Calculate pending payments
      const pendingPayments = reservations
        .filter(r => r.paymentStatus === "pending" || r.paymentStatus === "partial")
        .reduce((sum, r) => sum + parseFloat(r.totalPrice.toString()), 0);
      const pendingPaymentsCount = reservations.filter(r => r.paymentStatus === "pending" || r.paymentStatus === "partial").length;

      // Find upcoming deadlines (next 30 days) with full details
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingDeadlinesData = await Promise.all(
        reservations
          .filter(r => {
            if (!r.paymentDueDate) return false;
            const dueDate = new Date(r.paymentDueDate);
            return dueDate >= now && dueDate <= thirtyDaysFromNow && (r.paymentStatus === "pending" || r.paymentStatus === "partial");
          })
          .map(async (r) => {
            const tour = await storage.getTour(r.tourId);
            const dueDate = new Date(r.paymentDueDate!);
            const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            // Calculate balance due (totalPrice - paid installments)
            const installments = await storage.getPaymentInstallments(r.id);
            const paidAmount = installments
              .filter((i: any) => i.status === "paid")
              .reduce((sum: number, i: any) => sum + parseFloat(i.amountDue.toString()), 0);
            const balanceDue = parseFloat(r.totalPrice.toString()) - paidAmount;

            return {
              reservationId: r.id,
              bookingCode: r.id.substring(0, 8).toUpperCase(),
              tourName: tour?.title || "Tour no encontrado",
              departureDate: r.departureDate,
              daysRemaining,
              dueDate: r.paymentDueDate,
              balanceDue,
            };
          })
      );

      const upcomingDeadlines = upcomingDeadlinesData
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .slice(0, 10); // Top 10

      // Funnel data - conversion flow
      const funnel = {
        received: reservations.filter(r => r.status === "pending").length,
        underReview: reservations.filter(r => r.status === "approved" && r.paymentStatus === "pending").length,
        approved: reservations.filter(r => r.status === "approved").length,
        partialPaid: reservations.filter(r => r.paymentStatus === "partial").length,
        paid: reservations.filter(r => r.paymentStatus === "completed" || r.status === "confirmed").length,
      };

      // Occupation by departure - group reservations by tour+date
      const departureGroups = new Map<string, { tourId: string; tourName: string; departureDate: string; passengerCount: number; maxPassengers: number }>();
      
      for (const reservation of reservations.filter(r => r.status !== "cancelled")) {
        const key = `${reservation.tourId}-${reservation.departureDate}`;
        const tour = tours.find(t => t.id === reservation.tourId);
        
        if (tour && reservation.departureDate) {
          const departureDateObj = new Date(reservation.departureDate);
          if (departureDateObj >= now) { // Only future departures
            const existing = departureGroups.get(key);
            if (existing) {
              existing.passengerCount += reservation.numberOfPassengers;
            } else {
              departureGroups.set(key, {
                tourId: reservation.tourId,
                tourName: tour.title,
                departureDate: reservation.departureDate.toISOString(),
                passengerCount: reservation.numberOfPassengers,
                maxPassengers: tour.maxPassengers,
              });
            }
          }
        }
      }

      const occupationByDeparture = Array.from(departureGroups.values())
        .map(dep => ({
          tourName: dep.tourName,
          departureDate: dep.departureDate,
          occupiedSeats: dep.passengerCount,
          maxSeats: dep.maxPassengers,
          occupationPercentage: dep.maxPassengers > 0 ? Math.round((dep.passengerCount / dep.maxPassengers) * 100) : 0,
        }))
        .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
        .slice(0, 10); // Next 10 departures

      res.json({
        gmv,
        reservationsByStatus,
        averageOccupation: Math.round(averageOccupation * 10) / 10, // Round to 1 decimal
        pendingPayments: {
          amount: pendingPayments,
          count: pendingPaymentsCount,
        },
        upcomingDeadlinesCount: upcomingDeadlines.length,
        upcomingDeadlines,
        funnel,
        occupationByDeparture,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard KPIs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tour routes
  app.get("/api/tours", async (req, res) => {
    try {
      const { location } = req.query;
      const tours = await storage.searchTours(location as string);
      res.json(tours);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tours/:id", async (req, res) => {
    try {
      const tour = await storage.getTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ error: "Tour no encontrado" });
      }
      res.json(tour);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tours", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertTourSchema.parse(req.body);
      const tour = await storage.createTour(validatedData);
      res.status(201).json(tour);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/tours/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertTourSchema.partial().parse(req.body);
      const tour = await storage.updateTour(req.params.id, validatedData);
      if (!tour) {
        return res.status(404).json({ error: "Tour no encontrado" });
      }
      res.json(tour);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tours/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deleteTour(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Departure routes
  app.get("/api/departures", async (req, res) => {
    try {
      const { tourId } = req.query;
      const departures = await storage.getDepartures(tourId as string | undefined);
      res.json(departures);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/departures/:id", async (req, res) => {
    try {
      const departure = await storage.getDeparture(req.params.id);
      if (!departure) {
        return res.status(404).json({ error: "Salida no encontrada" });
      }
      res.json(departure);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/departures", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertDepartureSchema.parse(req.body);
      
      // Validación: fechas futuras
      if (new Date(validatedData.departureDate) < new Date()) {
        return res.status(400).json({ error: "La fecha de salida debe ser futura" });
      }
      
      // Validación: totalSeats > 0
      if (validatedData.totalSeats <= 0) {
        return res.status(400).json({ error: "El total de cupos debe ser mayor a 0" });
      }
      
      const departure = await storage.createDeparture(validatedData);
      res.status(201).json(departure);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/departures/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertDepartureSchema.partial().parse(req.body);
      
      // Validación: si se actualiza fecha, debe ser futura
      if (validatedData.departureDate && new Date(validatedData.departureDate) < new Date()) {
        return res.status(400).json({ error: "La fecha de salida debe ser futura" });
      }
      
      // Validación: si se actualizan cupos, validar contra reservas
      if (validatedData.totalSeats !== undefined) {
        const existing = await storage.getDeparture(req.params.id);
        if (existing && validatedData.totalSeats < existing.reservedSeats) {
          return res.status(400).json({ 
            error: `No se puede reducir cupos a ${validatedData.totalSeats}. Ya hay ${existing.reservedSeats} cupos reservados` 
          });
        }
      }
      
      const departure = await storage.updateDeparture(req.params.id, validatedData);
      if (!departure) {
        return res.status(404).json({ error: "Salida no encontrada" });
      }
      res.json(departure);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/departures/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const departure = await storage.getDeparture(req.params.id);
      if (!departure) {
        return res.status(404).json({ error: "Salida no encontrada" });
      }
      
      // Validación: no eliminar si tiene reservas
      if (departure.reservedSeats > 0) {
        return res.status(400).json({ 
          error: "No se puede eliminar una salida con reservas activas" 
        });
      }
      
      await storage.deleteDeparture(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/departures/:id/duplicate", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { dates } = req.body;
      
      if (!Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({ error: "Se requiere un array de fechas" });
      }
      
      const original = await storage.getDeparture(req.params.id);
      if (!original) {
        return res.status(404).json({ error: "Salida original no encontrada" });
      }
      
      const createdDepartures = [];
      for (const date of dates) {
        // Validar que la fecha sea futura
        if (new Date(date) < new Date()) {
          continue; // Saltar fechas pasadas
        }
        
        const newDeparture = await storage.createDeparture({
          tourId: original.tourId,
          departureDate: new Date(date),
          returnDate: original.returnDate ? new Date(new Date(date).getTime() + (new Date(original.returnDate).getTime() - new Date(original.departureDate).getTime())) : undefined,
          totalSeats: original.totalSeats,
          price: original.price,
          supplements: original.supplements as any,
          cancellationPolicyOverride: original.cancellationPolicyOverride,
          paymentDeadlineDays: original.paymentDeadlineDays,
          status: original.status,
        });
        createdDepartures.push(newDeparture);
      }
      
      res.status(201).json({ 
        message: `${createdDepartures.length} salidas creadas exitosamente`,
        departures: createdDepartures 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Reservation routes
  app.get("/api/reservations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Admins can see all reservations, clients only see their own
      const userId = req.user!.role === "admin" ? undefined : req.user!.userId;
      const reservations = await storage.getReservations(userId);
      res.json(reservations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reservations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // Check if user has access to this reservation
      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      res.json(reservation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reservations", async (req: Request, res: Response) => {
    try {
      const { emailService } = await import("./services/emailService");
      
      // Validate basic reservation data (userId is now optional for anonymous bookings)
      const validatedData = insertReservationSchema.parse(req.body);

      // Require departureId
      if (!validatedData.departureId) {
        return res.status(400).json({ error: "Debe seleccionar una salida específica" });
      }

      // Get departure to validate seats and get details
      const departure = await storage.getDeparture(validatedData.departureId);
      if (!departure) {
        return res.status(404).json({ error: "Salida no encontrada" });
      }

      // Get tour for details
      const tour = await storage.getTour(departure.tourId);
      if (!tour) {
        return res.status(404).json({ error: "Tour no encontrado" });
      }

      // Validate available seats against departure capacity
      const availableSeats = departure.totalSeats - departure.reservedSeats;
      if (validatedData.numberOfPassengers > availableSeats) {
        return res.status(400).json({ 
          error: `No hay suficientes cupos disponibles en esta salida. Cupos disponibles: ${availableSeats}` 
        });
      }

      // Calculate total price using departure price
      const totalPrice = parseFloat(departure.price) * validatedData.numberOfPassengers;

      // Calculate payment due date using departure's deadline days
      const departureDate = new Date(departure.departureDate);
      const paymentDueDate = new Date(departureDate);
      paymentDueDate.setDate(paymentDueDate.getDate() - (departure.paymentDeadlineDays || 30));

      // Calculate auto-cancel date (24 hours after payment due date)
      const autoCancelAt = new Date(paymentDueDate);
      autoCancelAt.setHours(autoCancelAt.getHours() + 24);

      // CRÍTICO: Usar método atómico para prevenir race conditions (overbooking)
      // Esta transacción garantiza que verificación de cupos + creación + actualización sean una operación indivisible
      const reservation = await storage.createReservationAtomic(
        {
          ...validatedData,
          tourId: departure.tourId,
          departureDate: departure.departureDate,
          totalPrice: totalPrice.toString(),
          paymentDueDate,
          autoCancelAt,
        },
        departure.id,
        validatedData.numberOfPassengers
      );

      // Log timeline event
      await storage.createTimelineEvent({
        reservationId: reservation.id,
        eventType: "reservation_created",
        description: validatedData.userId 
          ? `Reserva creada por cliente autenticado`
          : `Reserva creada de forma anónima`,
        performedBy: validatedData.userId || null,
        metadata: JSON.stringify({ 
          tourTitle: tour.title,
          departureDate: departure.departureDate.toISOString(),
          passengers: validatedData.numberOfPassengers,
          totalPrice: totalPrice,
          buyerEmail: validatedData.buyerEmail,
        }),
      });

      // Get user for email (if authenticated)
      const user = validatedData.userId ? await storage.getUser(validatedData.userId) : null;
      
      // Get passengers for email
      const passengers = await storage.getPassengersByReservation(reservation.id);

      // Send confirmation email (using buyer email for anonymous reservations)
      const emailRecipient: any = user || {
        email: validatedData.buyerEmail,
        name: validatedData.buyerName,
      };
      
      emailService.sendReservationConfirmation(emailRecipient, reservation, tour, passengers)
        .catch(error => console.error("Error enviando email de confirmación:", error));

      res.status(201).json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/reservations/:id/status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { emailService } = await import("./services/emailService");
      const { status, paymentStatus } = req.body;
      
      // Get current reservation
      const currentReservation = await storage.getReservation(req.params.id);
      if (!currentReservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      const oldStatus = currentReservation.status;
      const oldPaymentStatus = currentReservation.paymentStatus;

      let reservation;
      
      // CRÍTICO: Si se está cancelando, usar método atómico para prevenir race conditions
      if (status === "cancelled" || status === "cancelada" || status === "vencida") {
        // Usar transacción para garantizar que actualización de estado + liberación de cupos sean atómicas
        reservation = await storage.cancelReservationAtomic(
          req.params.id,
          status,
          paymentStatus
        );
      } else {
        // Para otros cambios de estado, usar método normal
        reservation = await storage.updateReservationStatus(
          req.params.id,
          status,
          paymentStatus
        );
      }

      // Log timeline events
      if (status && status !== oldStatus) {
        await storage.createTimelineEvent({
          reservationId: req.params.id,
          eventType: "status_changed",
          description: `Estado cambiado de "${oldStatus}" a "${status}" por administrador`,
          performedBy: req.user!.userId,
          metadata: JSON.stringify({ oldStatus, newStatus: status }),
        });
      }

      if (paymentStatus && paymentStatus !== oldPaymentStatus) {
        await storage.createTimelineEvent({
          reservationId: req.params.id,
          eventType: "payment_status_changed",
          description: `Estado de pago cambiado de "${oldPaymentStatus}" a "${paymentStatus}" por administrador`,
          performedBy: req.user!.userId,
          metadata: JSON.stringify({ oldPaymentStatus, newPaymentStatus: paymentStatus }),
        });
      }

      // If payment is confirmed, send itinerary
      if (paymentStatus === "confirmed" && reservation && reservation.userId) {
        const user = await storage.getUser(reservation.userId);
        const tour = reservation.tourId ? await storage.getTour(reservation.tourId) : null;
        const passengers = await storage.getPassengersByReservation(reservation!.id);
        
        if (user && tour) {
          emailService.sendItinerary(user, reservation!, tour, passengers)
            .catch(error => console.error("Error enviando itinerario:", error));
        }
      }

      res.json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Passenger routes
  app.get("/api/passengers", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const passengers = await storage.getAllPassengers();
      res.json(passengers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reservations/:reservationId/passengers", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Verify the user has access to this reservation
      const reservation = await storage.getReservation(req.params.reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const passengers = await storage.getPassengersByReservation(req.params.reservationId);
      res.json(passengers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/passengers", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPassengerSchema.parse(req.body);
      
      // Verify the user has access to this reservation
      const reservation = await storage.getReservation(validatedData.reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const passenger = await storage.createPassenger(validatedData);
      res.status(201).json(passenger);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/passengers/:id/document-status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { status, notes } = req.body;
      const { emailService } = await import("./services/emailService");

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Estado inválido. Debe ser: pending, approved, o rejected" });
      }

      const passenger = await storage.updatePassengerDocumentStatus(req.params.id, status, notes);
      
      if (!passenger) {
        return res.status(404).json({ error: "Pasajero no encontrado" });
      }

      // Get reservation for timeline event and email
      const reservation = await storage.getReservation(passenger.reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // Create timeline event
      await storage.createTimelineEvent({
        reservationId: passenger.reservationId,
        eventType: status === 'approved' ? 'document_approved' : status === 'rejected' ? 'document_rejected' : 'document_pending',
        description: status === 'approved' 
          ? `Documento de ${passenger.fullName} aprobado`
          : status === 'rejected'
          ? `Documento de ${passenger.fullName} rechazado - Se solicitó corrección`
          : `Documento de ${passenger.fullName} marcado como pendiente`,
        performedBy: req.user!.userId,
        metadata: JSON.stringify({ 
          passengerId: passenger.id,
          passengerName: passenger.fullName,
          documentStatus: status,
          notes: notes || null
        }),
      });

      // If rejected, send email to buyer requesting correction
      if (status === 'rejected') {
        const tour = await storage.getTour(reservation.tourId);
        
        emailService.sendDocumentRejectionNotification(
          { email: reservation.buyerEmail, name: reservation.buyerName },
          reservation,
          passenger,
          tour,
          notes || "El documento no cumple con los requisitos necesarios"
        ).catch(error => console.error("Error enviando email de rechazo de documento:", error));
      }

      res.json(passenger);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Payment routes
  app.post("/api/payments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      
      // Verify the user has access to this reservation
      const reservation = await storage.getReservation(validatedData.reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/payments/:id/confirm", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const payment = await storage.updatePaymentStatus(
        req.params.id,
        "confirmed",
        req.user!.userId
      );
      if (!payment) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Payment Installments routes
  app.get("/api/reservations/:reservationId/installments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Verify the user has access to this reservation
      const reservation = await storage.getReservation(req.params.reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const installments = await storage.getPaymentInstallments(req.params.reservationId);
      res.json(installments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reservations/:reservationId/installments", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const reservation = await storage.getReservation(req.params.reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      const validatedData = insertPaymentInstallmentSchema.parse({
        ...req.body,
        reservationId: req.params.reservationId,
      });

      const installment = await storage.createPaymentInstallment(validatedData);

      // Log timeline event
      await storage.createTimelineEvent({
        reservationId: req.params.reservationId,
        eventType: "installment_created",
        description: `Cuota de pago ${validatedData.installmentNumber} creada: $${validatedData.amountDue}`,
        performedBy: req.user!.userId,
        metadata: JSON.stringify({ 
          amountDue: validatedData.amountDue,
          dueDate: validatedData.dueDate,
          installmentNumber: validatedData.installmentNumber,
        }),
      });

      res.status(201).json(installment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/installments/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const installment = await storage.updatePaymentInstallment(req.params.id, req.body);
      if (!installment) {
        return res.status(404).json({ error: "Cuota no encontrada" });
      }
      res.json(installment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/installments/:id/pay", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { paymentMethod, paymentReference, exchangeRate, receiptUrl, paidAt } = req.body;
      
      const installment = await storage.updatePaymentInstallment(req.params.id, {
        status: 'paid',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paidBy: req.user!.userId,
        paymentMethod,
        paymentReference,
        exchangeRate,
        receiptUrl,
      });

      if (!installment) {
        return res.status(404).json({ error: "Cuota no encontrada" });
      }

      // Log timeline event
      const paymentDetails = [];
      if (paymentMethod) paymentDetails.push(`Método: ${paymentMethod}`);
      if (paymentReference) paymentDetails.push(`Ref: ${paymentReference}`);
      if (exchangeRate) paymentDetails.push(`TC: ${exchangeRate}`);

      await storage.createTimelineEvent({
        reservationId: installment.reservationId,
        eventType: "installment_paid",
        description: `Cuota ${installment.installmentNumber} marcada como pagada: $${installment.amountDue}${paymentDetails.length ? ' (' + paymentDetails.join(', ') + ')' : ''}`,
        performedBy: req.user!.userId,
        metadata: JSON.stringify({ 
          amountDue: installment.amountDue,
          installmentNumber: installment.installmentNumber,
          paymentMethod,
          paymentReference,
          exchangeRate,
          receiptUrl,
        }),
      });

      res.json(installment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/installments/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deletePaymentInstallment(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // System Configuration routes
  app.get("/api/config", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const configs = await storage.getAllSystemConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/config/:key", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const config = await storage.getSystemConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { key, value, description } = req.body;
      if (!key || !value) {
        return res.status(400).json({ error: "key y value son requeridos" });
      }
      const config = await storage.setSystemConfig(key, value, description);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Timeline routes
  app.get("/api/reservations/:id/timeline", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // Check authorization: admin can view all, clients can only view their own
      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "No autorizado para ver este historial" });
      }

      const events = await storage.getTimelineEvents(req.params.id);
      
      // Enrich events with user information
      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          if (event.performedBy) {
            const user = await storage.getUser(event.performedBy);
            return {
              ...event,
              performedByName: user ? `${user.name} (${user.email})` : 'Usuario desconocido',
            };
          }
          return {
            ...event,
            performedByName: 'Sistema automático',
          };
        })
      );

      res.json(enrichedEvents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PDF Generation routes
  app.get("/api/reservations/:id/invoice", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // Check authorization: admin can view all, clients can only view their own
      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "No autorizado para ver esta factura" });
      }

      const tour = await storage.getTour(reservation.tourId);
      if (!tour) {
        return res.status(404).json({ error: "Tour no encontrado" });
      }

      const passengers = await storage.getPassengersByReservation(req.params.id);
      const installments = await storage.getPaymentInstallments(req.params.id);
      const user = reservation.userId ? await storage.getUser(reservation.userId) : null;
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const pdfBuffer = await generateInvoicePDF({
        reservation,
        tour,
        passengers,
        installments,
        user,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura-${reservation.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generando factura PDF:", error);
      res.status(500).json({ error: "Error generando factura" });
    }
  });

  app.get("/api/reservations/:id/itinerary", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // Check authorization: admin can view all, clients can only view their own
      if (req.user!.role !== "admin" && reservation.userId !== req.user!.userId) {
        return res.status(403).json({ error: "No autorizado para ver este itinerario" });
      }

      // Only generate itinerary for confirmed reservations
      if (reservation.status !== "confirmed" && reservation.status !== "completed") {
        return res.status(400).json({ error: "El itinerario solo está disponible para reservas confirmadas" });
      }

      const tour = await storage.getTour(reservation.tourId);
      if (!tour) {
        return res.status(404).json({ error: "Tour no encontrado" });
      }

      const passengers = await storage.getPassengersByReservation(req.params.id);
      const user = reservation.userId ? await storage.getUser(reservation.userId) : null;
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const pdfBuffer = await generateItineraryPDF({
        reservation,
        tour,
        passengers,
        user,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="itinerario-${tour.title.replace(/\s+/g, '-')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generando itinerario PDF:", error);
      res.status(500).json({ error: "Error generando itinerario" });
    }
  });

  // Reports routes (admin only)
  app.get("/api/reports/sales", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { startDate, endDate, tourId, departureId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate y endDate son requeridos" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Formato de fecha inválido" });
      }

      const report = await storage.getSalesReport(
        start,
        end,
        tourId as string | undefined,
        departureId as string | undefined
      );

      res.json(report);
    } catch (error: any) {
      console.error("Error generando reporte de ventas:", error);
      res.status(500).json({ error: "Error generando reporte" });
    }
  });

  app.get("/api/reports/occupation", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { startDate, endDate, tourId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate y endDate son requeridos" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Formato de fecha inválido" });
      }

      const report = await storage.getOccupationReport(
        start,
        end,
        tourId as string | undefined
      );

      res.json(report);
    } catch (error: any) {
      console.error("Error generando reporte de ocupación:", error);
      res.status(500).json({ error: "Error generando reporte" });
    }
  });

  app.get("/api/reports/aging", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const report = await storage.getAgingReport();
      res.json(report);
    } catch (error: any) {
      console.error("Error generando reporte de aging:", error);
      res.status(500).json({ error: "Error generando reporte" });
    }
  });

  app.get("/api/payments/reconciliation", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { startDate, endDate, status, minAmount } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      if (status) filters.status = status as string;
      if (minAmount) filters.minAmount = parseFloat(minAmount as string);
      
      const data = await storage.getReconciliationData(filters);
      res.json(data);
    } catch (error: any) {
      console.error("Error obteniendo datos de conciliación:", error);
      res.status(500).json({ error: "Error obteniendo datos de conciliación" });
    }
  });

  app.get("/api/payments/calendar", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Se requieren startDate y endDate" });
      }
      
      const data = await storage.getPaymentCalendar(startDate as string, endDate as string);
      res.json(data);
    } catch (error: any) {
      console.error("Error obteniendo calendario de pagos:", error);
      res.status(500).json({ error: "Error obteniendo calendario de pagos" });
    }
  });

  app.get("/api/email-templates", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error obteniendo plantillas:", error);
      res.status(500).json({ error: "Error obteniendo plantillas" });
    }
  });

  app.get("/api/email-templates/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Plantilla no encontrada" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error obteniendo plantilla:", error);
      res.status(500).json({ error: "Error obteniendo plantilla" });
    }
  });

  app.get("/api/email-templates/by-type/:type", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const template = await storage.getEmailTemplateByType(req.params.type);
      if (!template) {
        return res.status(404).json({ error: "Plantilla no encontrada" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error obteniendo plantilla:", error);
      res.status(500).json({ error: "Error obteniendo plantilla" });
    }
  });

  app.post("/api/email-templates", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creando plantilla:", error);
      res.status(500).json({ error: "Error creando plantilla" });
    }
  });

  app.put("/api/email-templates/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const template = await storage.updateEmailTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Plantilla no encontrada" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error actualizando plantilla:", error);
      res.status(500).json({ error: "Error actualizando plantilla" });
    }
  });

  app.delete("/api/email-templates/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deleteEmailTemplate(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error eliminando plantilla:", error);
      res.status(500).json({ error: "Error eliminando plantilla" });
    }
  });

  app.post("/api/email-templates/:id/render", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Plantilla no encontrada" });
      }
      
      const { variables } = req.body;
      
      let renderedSubject = template.subject;
      let renderedBody = template.body;
      
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          renderedSubject = renderedSubject.replace(regex, value as string);
          renderedBody = renderedBody.replace(regex, value as string);
        }
      }
      
      res.json({
        subject: renderedSubject,
        body: renderedBody,
      });
    } catch (error: any) {
      console.error("Error renderizando plantilla:", error);
      res.status(500).json({ error: "Error renderizando plantilla" });
    }
  });

  // Reminder Rules routes
  app.get("/api/reminder-rules", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const rules = await storage.getReminderRules();
      res.json(rules);
    } catch (error: any) {
      console.error("Error obteniendo reglas de recordatorio:", error);
      res.status(500).json({ error: "Error obteniendo reglas de recordatorio" });
    }
  });

  app.get("/api/reminder-rules/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const rule = await storage.getReminderRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ error: "Regla no encontrada" });
      }
      res.json(rule);
    } catch (error: any) {
      console.error("Error obteniendo regla:", error);
      res.status(500).json({ error: "Error obteniendo regla" });
    }
  });

  app.post("/api/reminder-rules", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const rule = await storage.createReminderRule(req.body);
      res.status(201).json(rule);
    } catch (error: any) {
      console.error("Error creando regla:", error);
      res.status(500).json({ error: "Error creando regla" });
    }
  });

  app.put("/api/reminder-rules/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const rule = await storage.updateReminderRule(req.params.id, req.body);
      if (!rule) {
        return res.status(404).json({ error: "Regla no encontrada" });
      }
      res.json(rule);
    } catch (error: any) {
      console.error("Error actualizando regla:", error);
      res.status(500).json({ error: "Error actualizando regla" });
    }
  });

  app.delete("/api/reminder-rules/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deleteReminderRule(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error eliminando regla:", error);
      res.status(500).json({ error: "Error eliminando regla" });
    }
  });

  // Email Logs routes
  app.get("/api/reservations/:id/communications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const logs = await storage.getEmailLogsByReservation(req.params.id);
      res.json(logs);
    } catch (error: any) {
      console.error("Error obteniendo comunicaciones:", error);
      res.status(500).json({ error: "Error obteniendo comunicaciones" });
    }
  });

  app.post("/api/email-logs/:id/resend", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const log = await storage.getEmailLog(req.params.id);
      if (!log || !log.reservationId) {
        return res.status(404).json({ error: "Log de email no encontrado o sin reserva asociada" });
      }

      // Get reservation to find recipient
      const reservation = await storage.getReservation(log.reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // Resend using SMTP service with original template type
      // Extract variables from the body or use defaults
      const success = await smtpService.sendTemplateEmail(
        log.recipientEmail,
        log.templateType,
        {}, // Could parse variables from original body if needed
        log.reservationId
      );

      if (!success) {
        return res.status(500).json({ error: "No se pudo reenviar el email" });
      }

      res.json({ success: true, message: "Email reenviado correctamente" });
    } catch (error: any) {
      console.error("Error reenviando email:", error);
      res.status(500).json({ error: "Error reenviando email" });
    }
  });

  // Audit Logs routes
  app.get("/api/reservations/:id/audit", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const logs = await storage.getAuditLogsByReservation(req.params.id);
      res.json(logs);
    } catch (error: any) {
      console.error("Error obteniendo logs de auditoría:", error);
      res.status(500).json({ error: "Error obteniendo logs de auditoría" });
    }
  });

  // User Management routes
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password from response
      const sanitizedUsers = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error("Error obteniendo usuarios:", error);
      res.status(500).json({ error: "Error obteniendo usuarios" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, email, password, role } = req.body;
      
      // Validate required fields
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Ya existe un usuario con este correo electrónico" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Get permissions for the role
      const permissions = getPermissionsForRole(role);
      
      // Create user
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        permissions,
        active: true,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      res.status(500).json({ error: "Error creando usuario" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, email, active } = req.body;
      const user = await storage.updateUser(req.params.id, { name, email, active });
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      res.status(500).json({ error: "Error actualizando usuario" });
    }
  });

  app.put("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { role } = req.body;
      // Get permissions for the role
      const permissions = getPermissionsForRole(role);
      const user = await storage.updateUserRole(req.params.id, role, permissions);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error actualizando rol:", error);
      res.status(500).json({ error: "Error actualizando rol" });
    }
  });

  app.put("/api/admin/users/:id/permissions", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { permissions } = req.body;
      const user = await storage.updateUserPermissions(req.params.id, permissions);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error actualizando permisos:", error);
      res.status(500).json({ error: "Error actualizando permisos" });
    }
  });

  app.put("/api/admin/users/:id/toggle-active", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { active } = req.body;
      const user = await storage.toggleUserActive(req.params.id, active);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error cambiando estado de usuario:", error);
      res.status(500).json({ error: "Error cambiando estado de usuario" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Prevent self-deletion
      if (req.user && req.params.id === req.user.userId) {
        return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
      }
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      res.status(500).json({ error: "Error eliminando usuario" });
    }
  });

  // System Settings routes
  app.get("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const category = req.query.category as string | undefined;
      const settings = await storage.getSettings(category);
      res.json(settings);
    } catch (error: any) {
      console.error("Error obteniendo configuraciones:", error);
      res.status(500).json({ error: "Error obteniendo configuraciones" });
    }
  });

  app.get("/api/settings/:key", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Error obteniendo configuración:", error);
      res.status(500).json({ error: "Error obteniendo configuración" });
    }
  });

  app.post("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const setting = await storage.createSetting({
        ...req.body,
        updatedBy: req.user?.userId,
      });
      res.json(setting);
    } catch (error: any) {
      console.error("Error creando configuración:", error);
      res.status(500).json({ error: "Error creando configuración" });
    }
  });

  app.put("/api/settings/:key", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { value } = req.body;
      const setting = await storage.updateSetting(req.params.key, value, req.user?.userId);
      if (!setting) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Error actualizando configuración:", error);
      res.status(500).json({ error: "Error actualizando configuración" });
    }
  });

  app.delete("/api/settings/:key", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deleteSetting(req.params.key);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error eliminando configuración:", error);
      res.status(500).json({ error: "Error eliminando configuración" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
