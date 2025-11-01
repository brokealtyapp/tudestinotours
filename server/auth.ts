import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { type User } from "@shared/schema";
import { type Request, type Response, type NextFunction } from "express";
import { hasPermission, type Permission } from "./permissions";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRATION = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  // Import storage here to avoid circular dependency
  const { storage } = await import("./storage");
  
  // Verify user is still active
  const user = await storage.getUser(payload.userId);
  if (!user || !user.active) {
    return res.status(403).json({ error: "Cuenta inactiva o no encontrada" });
  }

  req.user = payload;
  next();
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userPermissions = req.user.permissions || [];
    
    if (!hasPermission(userPermissions, permission)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: permission,
      });
    }

    next();
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userPermissions = req.user.permissions || [];
    const hasAny = permissions.some(p => hasPermission(userPermissions, p));
    
    if (!hasAny) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: permissions,
      });
    }

    next();
  };
}
