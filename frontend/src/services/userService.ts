import { apiClient } from '@/lib/api';
import { User } from '@/types/auth';
import { ApiResponse } from '@/types/api';

class UserService {
  async getUsers(role?: string): Promise<User[]> {
    const endpoint = role ? `/users?role=${role}` : '/users';
    // The backend returns { success, data: { users, total, page, totalPages }, message }
    const response = await apiClient.get<ApiResponse<{ users: User[] }>>(endpoint);
    return response.data.users;
  }

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  async restoreUser(id: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/restore`);
    return response.data;
  }

  async getEmployees(): Promise<User[]> {
    return this.getUsers('employee');
  }

  async getClients(): Promise<User[]> {
    return this.getUsers('client');
  }
}

export const userService = new UserService();