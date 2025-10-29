import type { Express } from "express";
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
  insertReservationSchema,
  insertPassengerSchema,
  insertPaymentSchema,
} from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

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
      console.error("Error searching for public object:", error);
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
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
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
      console.error("Error normalizing image path:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/objects/normalize", authenticateToken, async (req: AuthRequest, res) => {
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
      console.error("Error normalizing object path:", error);
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

  app.post("/api/reservations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertReservationSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });
      const reservation = await storage.createReservation(validatedData);
      res.status(201).json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/reservations/:id/status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { status, paymentStatus } = req.body;
      const reservation = await storage.updateReservationStatus(
        req.params.id,
        status,
        paymentStatus
      );
      if (!reservation) {
        return res.status(404).json({ error: "Reserva no encontrada" });
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

  const httpServer = createServer(app);
  return httpServer;
}
