export interface User {
  uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  // Extended profile fields
  phone?: string;
  department?: string;
  designation?: string;
  bio?: string;
  // Employee-specific fields
  skillset?: string[];
  isAvailable?: boolean;
  // Status flags
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: FirebaseFirestore.Timestamp;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export type UserRole = 'client' | 'admin' | 'employee';

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  skillset?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
