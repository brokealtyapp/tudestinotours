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

export async function registerRoutes(app: Express): Promise<Server> {
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

      // Create reservation with calculated dates and departure details
      const reservation = await storage.createReservation({
        ...validatedData,
        tourId: departure.tourId,
        departureDate: departure.departureDate,
        totalPrice: totalPrice.toString(),
        paymentDueDate,
        autoCancelAt,
      });

      // Increment reserved seats for the departure
      await storage.updateDepartureSeats(departure.id, validatedData.numberOfPassengers);

      // Also increment tour seats for backward compatibility
      await storage.incrementReservedSeats(departure.tourId, validatedData.numberOfPassengers);

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

      // If cancelling or status is vencida/cancelada, release seats
      if (status === "cancelled" || status === "cancelada" || status === "vencida") {
        // Release seats from departure if it has one
        if (currentReservation.departureId) {
          await storage.updateDepartureSeats(
            currentReservation.departureId,
            -currentReservation.numberOfPassengers
          );
        }
        
        // Also release from tour for backward compatibility
        await storage.decrementReservedSeats(
          currentReservation.tourId,
          currentReservation.numberOfPassengers
        );
      }

      // Update reservation
      const reservation = await storage.updateReservationStatus(
        req.params.id,
        status,
        paymentStatus
      );

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
      if (paymentStatus === "confirmed") {
        const user = await storage.getUser(reservation!.userId);
        const tour = await storage.getTour(reservation!.tourId);
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
      const installment = await storage.markInstallmentAsPaid(req.params.id, req.user!.userId);
      if (!installment) {
        return res.status(404).json({ error: "Cuota no encontrada" });
      }

      // Log timeline event
      await storage.createTimelineEvent({
        reservationId: installment.reservationId,
        eventType: "installment_paid",
        description: `Cuota ${installment.installmentNumber} marcada como pagada: $${installment.amountDue}`,
        performedBy: req.user!.userId,
        metadata: JSON.stringify({ 
          amountDue: installment.amountDue,
          installmentNumber: installment.installmentNumber,
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
      const user = await storage.getUser(reservation.userId);
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
      const user = await storage.getUser(reservation.userId);
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

  const httpServer = createServer(app);
  return httpServer;
}
