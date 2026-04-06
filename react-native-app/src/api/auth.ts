import { apiRequest } from './client';
import { AuthResponse } from '../types/models';

export function register(userName: string, email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ userName, email, password })
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function validateToken(token: string): Promise<{ valid: boolean; userId: number; email: string }> {
  return apiRequest<{ valid: boolean; userId: number; email: string }>('/api/v1/auth/validate', {
    method: 'POST',
    token
  });
}
