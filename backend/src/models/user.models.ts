export interface User {
  uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  skillset?: string[];
  isAvailable?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
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
