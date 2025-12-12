import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storageService } from './storage.service';

// Utilise VITE_API_URL si défini (pour accès mobile), sinon /api (proxy Vite pour PC)
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: import.meta.env.VITE_API_URL ? false : true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storageService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only redirect to login on 401 if we're not already on the login page
    // and if we actually have a token (meaning it's invalid/expired)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const hasToken = storageService.getToken();
      
      // If we have a token and get 401, it means the token is invalid
      if (hasToken && currentPath !== '/login') {
        console.warn('Token invalid or expired, redirecting to login');
        storageService.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
