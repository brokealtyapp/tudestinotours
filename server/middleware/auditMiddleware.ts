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

// Helper to extract entity ID from path, handling nested routes
function extractEntityId(path: string, baseRoute: string): string | null {
  // Remove base route to get the remainder
  const remainder = path.substring(baseRoute.length);
  
  // Split by '/' and filter out empty parts
  const parts = remainder.split('/').filter(p => p.length > 0);
  
  // First part should be the ID (UUID or similar)
  // Examples:
  //   /api/tours/123 -> parts = ['123']
  //   /api/admin/users/abc-def/role -> parts = ['abc-def', 'role']
  //   /api/settings/my-key -> parts = ['my-key']
  
  if (parts.length === 0) {
    return null;
  }
  
  // Return first part (the ID)
  return parts[0];
}

// Capture "before" state for PUT/PATCH/DELETE operations
export async function captureBeforeState(req: AuditableRequest, res: Response, next: NextFunction) {
  // Only capture for PUT, PATCH, DELETE, POST
  if (!['PUT', 'PATCH', 'DELETE', 'POST'].includes(req.method)) {
    return next();
  }

  // Extract entity type from route
  let entityType: string | null = null;
  let baseRoute: string | null = null;
  for (const [route, type] of Object.entries(ROUTE_ENTITY_MAP)) {
    if (req.path.startsWith(route)) {
      entityType = type;
      baseRoute = route;
      break;
    }
  }

  if (!entityType || !baseRoute) {
    return next();
  }

  // For POST (creation), we don't need to capture before state
  if (req.method === 'POST') {
    req.__audit = {
      before: null,
      entityType,
      entityId: 'pending', // Will be set in createAuditLog from response
    };
    return next();
  }

  // Extract entity ID from path using improved helper
  const entityId = extractEntityId(req.path, baseRoute);

  // Skip if no valid ID
  if (!entityId) {
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
      case 'passenger':
        beforeState = await storage.getPassenger(entityId);
        break;
      case 'payment':
        beforeState = await storage.getPayment(entityId);
        break;
      case 'payment_installment':
        beforeState = await storage.getPaymentInstallment(entityId);
        break;
      case 'email_template':
        beforeState = await storage.getEmailTemplate(entityId);
        break;
      case 'reminder_rule':
        beforeState = await storage.getReminderRule(entityId);
        break;
      case 'user':
        beforeState = await storage.getUser(entityId);
        break;
      case 'system_setting':
        beforeState = await storage.getSystemSetting(entityId);
        break;
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

          let { before, entityType, entityId } = req.__audit;
          const after = body;

          // Determine action
          let action: string;
          if (req.method === 'DELETE') {
            action = 'deleted';
          } else if (req.method === 'PUT' || req.method === 'PATCH') {
            action = 'updated';
          } else if (req.method === 'POST') {
            action = 'created';
            // Extract entityId from response body for POST
            if (after && after.id) {
              entityId = after.id;
            } else if (after && after.key) {
              // For system_settings, use key as ID
              entityId = after.key;
            }
          } else {
            return; // Shouldn't happen
          }

          // Calculate changes (diff)
          const changes: Record<string, { before: any; after: any }> = {};
          
          if (action === 'deleted') {
            changes['_deleted'] = { before, after: null };
          } else if (action === 'created') {
            // For creation, show all fields as "after" with null "before"
            for (const key in after) {
              changes[key] = {
                before: null,
                after: after[key],
              };
            }
          } else {
            // Compare before and after for updated fields
            for (const key in after) {
              if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                changes[key] = {
                  before: before[key],
                  after: after[key],
                };
              }
            }
          }

          // Skip if no actual changes (except for created/deleted)
          if (Object.keys(changes).length === 0 && action !== 'deleted' && action !== 'created') {
            return;
          }

          // Extract reservationId if applicable
          let reservationId: string | null = null;
          if (entityType === 'reservation') {
            reservationId = entityId;
          } else if (after?.reservationId) {
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
