'use client';
import { useCallback } from 'react';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();

  const login = useCallback(async (data: { email?: string; phone?: string; password?: string }) => {
    try {
      const response = await authApi.login(data);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Logged in successfully');
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [setAuth]);

  const register = useCallback(async (data: { name: string; email?: string; phone?: string; password?: string; role?: string }) => {
    try {
      const response = await authApi.register(data);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Registered successfully');
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    clearAuth();
    toast.success('Logged out');
  }, [clearAuth]);

  const verifyOTP = useCallback(async (phone: string, otp: string) => {
    try {
      const response = await authApi.verifyOTP(phone, otp);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Phone verified successfully');
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'OTP verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [setAuth]);

  const sendOTP = useCallback(async (phone: string) => {
    try {
      await authApi.sendOTP(phone);
      toast.success('OTP sent successfully');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    verifyOTP,
    sendOTP,
    updateUser,
    isAdmin: user?.role === 'admin',
    isPharmacyOwner: user?.role === 'pharmacy_owner',
  };
}
