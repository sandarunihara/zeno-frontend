import { axiosClient } from './axiosClient';

export interface SignupPayload {
  fname: string;
  lname: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accesstoken: string;
  refreshtoken: string;
  message: string;
}

export const authApi = {
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/api/auth/signup', payload);
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/api/auth/login', payload);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/api/auth/refresh-token', {
      refreshtoken: refreshToken,
    });
    return response.data;
  },
};
