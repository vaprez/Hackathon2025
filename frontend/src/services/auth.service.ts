import axios from 'axios';
import api from './api';
import { storageService } from './storage.service';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // FastAPI OAuth2 attend un form-urlencoded avec username/password
    const params = new URLSearchParams();
    params.append('username', credentials.email);
    params.append('password', credentials.password);
    
    // Appel direct au backend pour éviter les problèmes de proxy
    const response = await axios.post<LoginResponse>(
      'http://192.168.27.20:8000/api/v1/auth/login',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    const { access_token, user } = response.data;
    
    storageService.setToken(access_token);
    storageService.setUser(user);
    
    return response.data;
  },

  logout(): void {
    storageService.clear();
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    storageService.setUser(response.data);
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!storageService.getToken();
  },

  getStoredUser(): User | null {
    return storageService.getUser<User>();
  },

  getToken(): string | null {
    return storageService.getToken();
  },
};
