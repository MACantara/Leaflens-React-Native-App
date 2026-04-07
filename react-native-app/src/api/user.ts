import { apiRequest } from './client';

export interface UserProfileResponse {
  userId: number;
  userName: string;
  email: string;
}

export interface UserUpdateResponse {
  message: string;
  userId: number;
  userName: string;
  email: string;
}

export interface UserDeleteResponse {
  message: string;
  userId: number;
}

export function getUserProfile(userId: number, token: string): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>(`/api/v1/user/${userId}`, {
    method: 'GET',
    token
  });
}

export function updateUserProfile(userId: number, token: string, userName: string, email: string): Promise<UserUpdateResponse> {
  return apiRequest<UserUpdateResponse>(`/api/v1/user/${userId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ userName, email })
  });
}

export function deleteUserProfile(userId: number, token: string): Promise<UserDeleteResponse> {
  return apiRequest<UserDeleteResponse>(`/api/v1/user/${userId}`, {
    method: 'DELETE',
    token
  });
}
