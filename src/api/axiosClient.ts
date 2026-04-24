import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const ANDROID_API_BASE_URL = process.env.EXPO_PUBLIC_ANDROID_API_BASE_URL;

const resolveApiBaseUrl = (): string => {
  if (Platform.OS === 'android' && ANDROID_API_BASE_URL) {
    return ANDROID_API_BASE_URL;
  }

  // Android emulator cannot reach host machine via localhost/127.0.0.1.
  if (Platform.OS === 'android') {
    try {
      const parsedUrl = new URL(RAW_API_BASE_URL);
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        parsedUrl.hostname = '10.0.2.2';
        return parsedUrl.toString().replace(/\/$/, '');
      }
    } catch (error) {
      console.warn('Invalid EXPO_PUBLIC_API_BASE_URL. Falling back to raw value.', error);
    }
  }

  return RAW_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableRequestConfig = {
  _retry?: boolean;
  headers?: Record<string, string>;
  url?: string;
};

let refreshPromise: Promise<string | null> | null = null;

const isAuthRoute = (url?: string): boolean => {
  if (!url) {
    return false;
  }
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/signup') ||
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/refresh-token')
  );
};

const isInvalidTokenResponse = (error: AxiosError): boolean => {
  const status = error.response?.status;
  const payloadMessage = (error.response?.data as { message?: string } | undefined)?.message;
  const rawMessage = typeof payloadMessage === 'string' ? payloadMessage : error.message;
  const normalizedMessage = rawMessage.toLowerCase();

  // Core service can surface invalid JWT as 400/500 instead of 401.
  return status === 401 || normalizedMessage.includes('invalid token');
};

const requestTokenRefresh = async (): Promise<string | null> => {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');

  if (!refreshToken) {
    return null;
  }

  const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
    refreshtoken: refreshToken,
  });

  const { accesstoken: newAccessToken, refreshtoken: newRefreshToken } = refreshResponse.data as {
    accesstoken: string;
    refreshtoken?: string;
  };

  await SecureStore.setItemAsync('accessToken', newAccessToken);
  if (newRefreshToken) {
    await SecureStore.setItemAsync('refreshToken', newRefreshToken);
  }

  return newAccessToken;
};

// Request interceptor: Add access token to every request
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Error retrieving token from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh token
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as RetryableRequestConfig;

    if (!isAuthRoute(originalRequest.url) && isInvalidTokenResponse(error) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = requestTokenRefresh();
        }

        const newAccessToken = await refreshPromise;
        refreshPromise = null;

        if (!newAccessToken) {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          return Promise.reject(error);
        }

        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newAccessToken}`,
        };

        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        refreshPromise = null;
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
