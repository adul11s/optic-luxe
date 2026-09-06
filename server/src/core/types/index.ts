import { Request } from 'express';

export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}