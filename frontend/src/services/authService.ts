import { apiClient } from '@/lib/api';
import { AuthResponse, LoginRequest, SignupRequest, User } from '@/types/auth';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/signup', userData);
  }

  async logout(): Promise<void> {
    return apiClient.post<void>('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return apiClient.patch<User>('/users', userData);
  }
}

export const authService = new AuthService();