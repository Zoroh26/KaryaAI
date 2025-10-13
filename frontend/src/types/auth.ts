export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'client';
  avatar?: string;
  skills?: string[];
  workload?: number;
  isAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee' | 'client';
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