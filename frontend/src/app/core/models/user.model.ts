export type UserRole = 'USER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  counterAssigned?: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn?: number;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
  department?: string;
}
