export type Role = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST' | 'CASHIER';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export type Permission =
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'patient:read'
  | 'patient:create'
  | 'patient:update'
  | 'patient:delete'
  | 'medical_record:read'
  | 'medical_record:create'
  | 'medical_record:update'
  | 'medical_record:delete'
  | 'prescription:read'
  | 'prescription:create'
  | 'prescription:update'
  | 'prescription:delete'
  | 'medication:read'
  | 'medication:create'
  | 'medication:update'
  | 'medication:delete'
  | 'queue:read'
  | 'queue:create'
  | 'queue:update'
  | 'queue:delete'
  | 'schedule:read'
  | 'schedule:create'
  | 'schedule:update'
  | 'schedule:delete'
  | 'billing:read'
  | 'billing:create'
  | 'billing:update'
  | 'billing:delete';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'patient:read', 'patient:create', 'patient:update', 'patient:delete',
    'medical_record:read', 'medical_record:create', 'medical_record:update', 'medical_record:delete',
    'prescription:read', 'prescription:create', 'prescription:update', 'prescription:delete',
    'medication:read', 'medication:create', 'medication:update', 'medication:delete',
    'queue:read', 'queue:create', 'queue:update', 'queue:delete',
    'schedule:read', 'schedule:create', 'schedule:update', 'schedule:delete',
    'billing:read', 'billing:create', 'billing:update', 'billing:delete',
  ],
  DOCTOR: [
    'patient:read',
    'medical_record:read', 'medical_record:create', 'medical_record:update',
    'prescription:read', 'prescription:create', 'prescription:update',
    'medication:read',
    'queue:read',
    'schedule:read',
  ],
  RECEPTIONIST: [
    'patient:read', 'patient:create', 'patient:update',
    'queue:read', 'queue:create', 'queue:update',
    'schedule:read',
  ],
  PHARMACIST: [
    'medication:read', 'medication:create', 'medication:update', 'medication:delete',
    'prescription:read', 'prescription:update',
    'queue:read',
  ],
  CASHIER: [
    'patient:read',
    'medication:read',
    'queue:read',
    'billing:read', 'billing:create', 'billing:update',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}