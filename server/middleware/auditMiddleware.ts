import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

interface AuditableRequest extends AuthRequest {
  __audit?: {
    before: any;
    entityType: string;
    entityId: string;
  };
}

// Map of routes to entity types
const ROUTE_ENTITY_MAP: Record<string, string> = {
  '/api/tours': 'tour',
  '/api/departures': 'departure',
  '/api/reservations': 'reservation',
  '/api/passengers': 'passenger',
  '/api/payments': 'payment',
  '/api/payment-installments': 'payment_installment',
  '/api/email-templates': 'email_template',
  '/api/reminder-rules': 'reminder_rule',
  '/api/admin/users': 'user',
  '/api/settings': 'system_setting',
};

// Capture "before" state for PUT/PATCH/DELETE operations
export async function captureBeforeState(req: AuditableRequest, res: Response, next: NextFunction) {
  // Only capture for PUT, PATCH, DELETE
  if (!['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Extract entity type from route
  let entityType: string | null = null;
  for (const [route, type] of Object.entries(ROUTE_ENTITY_MAP)) {
    if (req.path.startsWith(route)) {
      entityType = type;
      break;
    }
  }

  if (!entityType) {
    return next();
  }

  // Extract entity ID from path (assumes /:id pattern)
  const pathParts = req.path.split('/');
  const entityId = pathParts[pathParts.length - 1];

  // Skip if no valid ID (e.g., /api/tours without ID)
  if (!entityId || entityId === 'tours' || entityId === 'departures' || entityId === 'reservations' || entityId === 'passengers') {
    return next();
  }

  try {
    // Fetch current state based on entity type
    let beforeState: any = null;
    
    switch (entityType) {
      case 'tour':
        beforeState = await storage.getTour(entityId);
        break;
      case 'departure':
        beforeState = await storage.getDeparture(entityId);
        break;
      case 'reservation':
        beforeState = await storage.getReservation(entityId);
        break;
      // Add more cases as needed (passenger, payment, etc.)
    }

    if (beforeState) {
      req.__audit = {
        before: beforeState,
        entityType,
        entityId,
      };
    }
  } catch (error) {
    console.error('[AUDIT] Error capturing before state:', error);
  }

  next();
}

// Create audit log after successful modification
export async function createAuditLog(req: AuditableRequest, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    // Only audit successful responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Async audit logging (don't block response)
      setImmediate(async () => {
        try {
          if (!req.__audit || !req.user) {
            return;
          }

          const { before, entityType, entityId } = req.__audit;
          const after = body;

          // Determine action
          let action: string;
          if (req.method === 'DELETE') {
            action = 'deleted';
          } else if (req.method === 'PUT' || req.method === 'PATCH') {
            action = 'updated';
          } else {
            return; // Shouldn't happen
          }

          // Calculate changes (diff)
          const changes: Record<string, { before: any; after: any }> = {};
          
          if (action === 'deleted') {
            changes['_deleted'] = { before, after: null };
          } else {
            // Compare before and after for updated fields
            for (const key in after) {
              if (before[key] !== after[key]) {
                changes[key] = {
                  before: before[key],
                  after: after[key],
                };
              }
            }
          }

          // Skip if no actual changes
          if (Object.keys(changes).length === 0 && action !== 'deleted') {
            return;
          }

          // Extract reservationId if applicable
          let reservationId: string | null = null;
          if (entityType === 'reservation') {
            reservationId = entityId;
          } else if (after.reservationId) {
            reservationId = after.reservationId;
          } else if (before?.reservationId) {
            reservationId = before.reservationId;
          }

          // Create audit log
          await storage.createAuditLog({
            userId: req.user.userId,
            reservationId,
            action,
            entityType,
            entityId,
            changes: changes as any,
          });

          console.log(`[AUDIT] ${action} ${entityType} ${entityId} by user ${req.user.userId}`);
        } catch (error) {
          console.error('[AUDIT] Error creating audit log:', error);
        }
      });
    }

    return originalJson(body);
  };

  next();
}
