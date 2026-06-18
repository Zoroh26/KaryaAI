import { apiClient } from '@/lib/api';
import { AuthResponse, LoginRequest, SignupRequest, User } from '@/types/auth';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean, message: string, data: { user: User, token: string } }>('/auth/login', credentials);
    return {
      user: response.data.user,
      token: response.data.token,
      message: response.message
    };
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean, message: string, data: User }>('/auth/signup', userData);
    return {
      user: response.data,
      token: '', // Signup doesn't return token immediately in all setups, or does it? Wait, let me check backend.
      message: response.message
    };
  }

  async logout(): Promise<void> {
    await apiClient.post<void>('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean, data: { user: User } | User }>('/auth/me');
    // Handle both /auth/me returning data: User and data: { user: User }
    return (response.data as any).user || response.data;
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    const response = await apiClient.patch<{ success: boolean, data: { user: User } | User }>('/users', userData);
    return (response.data as any).user || response.data;
  }
}

export const authService = new AuthService();