import type { UserRole, EntityStatus } from '../enums/domain.enum';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  teamId: string | null;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: unknown;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export type EntityStatusT = EntityStatus;
