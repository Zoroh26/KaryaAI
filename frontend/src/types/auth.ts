export interface User {
  uid: string;
  full_name: string;
  email: string;
  role: 'admin' | 'employee' | 'client';
  avatar?: string;
  // Extended profile fields
  phone?: string;
  department?: string;
  designation?: string;
  bio?: string;
  // Employee-specific
  skillset?: string[];
  workload?: number;
  isAvailable?: boolean;
  // Status
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee' | 'client';
  // Extended profile fields (optional)
  phone?: string;
  department?: string;
  designation?: string;
  bio?: string;
  skillset?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}