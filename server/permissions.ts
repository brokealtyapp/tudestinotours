// Sistema de permisos granulares para Tu Destino Tours

export const PERMISSIONS = {
  // Tours
  TOURS_VIEW: 'tours:view',
  TOURS_CREATE: 'tours:create',
  TOURS_EDIT: 'tours:edit',
  TOURS_DELETE: 'tours:delete',
  
  // Departures
  DEPARTURES_VIEW: 'departures:view',
  DEPARTURES_CREATE: 'departures:create',
  DEPARTURES_EDIT: 'departures:edit',
  DEPARTURES_DELETE: 'departures:delete',
  
  // Reservations
  RESERVATIONS_VIEW: 'reservations:view',
  RESERVATIONS_VIEW_ALL: 'reservations:view_all',
  RESERVATIONS_EDIT: 'reservations:edit',
  RESERVATIONS_DELETE: 'reservations:delete',
  RESERVATIONS_MANAGE_PAYMENTS: 'reservations:manage_payments',
  
  // Passengers
  PASSENGERS_VIEW: 'passengers:view',
  PASSENGERS_EDIT: 'passengers:edit',
  PASSENGERS_VERIFY_DOCUMENTS: 'passengers:verify_documents',
  
  // Payments
  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_RECORD: 'payments:record',
  PAYMENTS_RECONCILE: 'payments:reconcile',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Communications
  EMAIL_TEMPLATES_MANAGE: 'email_templates:manage',
  EMAIL_SEND: 'email:send',
  EMAIL_VIEW_LOGS: 'email:view_logs',
  
  // System
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_VIEW: 'audit:view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Roles predefinidos
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  CLIENT: 'client',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Permisos por rol
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Todos los permisos
  
  [ROLES.ADMIN]: [
    PERMISSIONS.TOURS_VIEW,
    PERMISSIONS.TOURS_CREATE,
    PERMISSIONS.TOURS_EDIT,
    PERMISSIONS.TOURS_DELETE,
    PERMISSIONS.DEPARTURES_VIEW,
    PERMISSIONS.DEPARTURES_CREATE,
    PERMISSIONS.DEPARTURES_EDIT,
    PERMISSIONS.DEPARTURES_DELETE,
    PERMISSIONS.RESERVATIONS_VIEW_ALL,
    PERMISSIONS.RESERVATIONS_EDIT,
    PERMISSIONS.RESERVATIONS_DELETE,
    PERMISSIONS.RESERVATIONS_MANAGE_PAYMENTS,
    PERMISSIONS.PASSENGERS_VIEW,
    PERMISSIONS.PASSENGERS_EDIT,
    PERMISSIONS.PASSENGERS_VERIFY_DOCUMENTS,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.PAYMENTS_RECONCILE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.EMAIL_TEMPLATES_MANAGE,
    PERMISSIONS.EMAIL_SEND,
    PERMISSIONS.EMAIL_VIEW_LOGS,
    PERMISSIONS.AUDIT_VIEW,
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.TOURS_VIEW,
    PERMISSIONS.TOURS_EDIT,
    PERMISSIONS.DEPARTURES_VIEW,
    PERMISSIONS.DEPARTURES_EDIT,
    PERMISSIONS.RESERVATIONS_VIEW_ALL,
    PERMISSIONS.RESERVATIONS_EDIT,
    PERMISSIONS.RESERVATIONS_MANAGE_PAYMENTS,
    PERMISSIONS.PASSENGERS_VIEW,
    PERMISSIONS.PASSENGERS_EDIT,
    PERMISSIONS.PASSENGERS_VERIFY_DOCUMENTS,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.EMAIL_SEND,
    PERMISSIONS.EMAIL_VIEW_LOGS,
  ],
  
  [ROLES.AGENT]: [
    PERMISSIONS.TOURS_VIEW,
    PERMISSIONS.DEPARTURES_VIEW,
    PERMISSIONS.RESERVATIONS_VIEW_ALL,
    PERMISSIONS.RESERVATIONS_EDIT,
    PERMISSIONS.PASSENGERS_VIEW,
    PERMISSIONS.PASSENGERS_EDIT,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.EMAIL_SEND,
  ],
  
  [ROLES.CLIENT]: [
    PERMISSIONS.TOURS_VIEW,
    PERMISSIONS.DEPARTURES_VIEW,
    PERMISSIONS.RESERVATIONS_VIEW,
  ],
};

// Helper function para verificar si un usuario tiene un permiso
export function hasPermission(userPermissions: string[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper function para verificar si un usuario tiene alguno de los permisos requeridos
export function hasAnyPermission(userPermissions: string[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

// Helper function para verificar si un usuario tiene todos los permisos requeridos
export function hasAllPermissions(userPermissions: string[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

// Helper function para obtener los permisos de un rol
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
