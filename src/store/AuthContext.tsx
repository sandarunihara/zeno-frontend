import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../api/axiosClient';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  onboardingComplete: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  signup: (fname: string, lname: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is already logged in on app launch
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync('accessToken');
        const onboardingFlag = await SecureStore.getItemAsync('onboarding_complete');

        if (onboardingFlag === 'true') {
          setOnboardingComplete(true);
        }

        if (accessToken) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    const logoutListener = DeviceEventEmitter.addListener('auth:logout', () => {
      setIsLoggedIn(false);
      setUser(null);
    });

    return () => {
      logoutListener.remove();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await axiosClient.post('/api/auth/login', {
        email,
        password,
      });

      const { accesstoken, refreshtoken } = response.data;

      await SecureStore.setItemAsync('accessToken', String(accesstoken));
      await SecureStore.setItemAsync('refreshToken', String(refreshtoken));

      setIsLoggedIn(true);
    } catch (error) {
      throw error;
    }
  }, []);

  const signup = useCallback(
    async (fname: string, lname: string, email: string, password: string) => {
      try {
        const response = await axiosClient.post('/api/auth/signup', {
          fname,
          lname,
          email,
          password,
        });
        console.log("Signup response:", response.data);


        const { accesstoken, refreshtoken } = response.data;

        await SecureStore.setItemAsync('accessToken', String(accesstoken));
        await SecureStore.setItemAsync('refreshToken', String(refreshtoken));

        setIsLoggedIn(true);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await SecureStore.setItemAsync('onboarding_complete', 'true');
      setOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        onboardingComplete,
        user,
        login,
        signup,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
