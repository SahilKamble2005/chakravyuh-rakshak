import api from './api';
import { User } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    // const response = await api.post('/auth/login', { email, password });
    // return response.data;
    
    // Mock for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: { id: '1', name: 'Admin', email, role: 'admin' },
          token: 'mock-jwt-token'
        });
      }, 500);
    });
  },

  logout: async () => {
    // await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};
