import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, Medicine, Pharmacy, Inventory, Reservation, User, DashboardStats } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor - attach token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email?: string; phone?: string; password?: string; role?: string }) =>
    apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data),

  login: (data: { email?: string; phone?: string; password?: string }) =>
    apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', data),

  sendOTP: (phone: string) =>
    apiClient.post<ApiResponse<null>>('/auth/otp/send', { phone }),

  verifyOTP: (phone: string, otp: string) =>
    apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/otp/verify', { phone, otp }),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post<ApiResponse<null>>('/auth/logout', { refreshToken }),

  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/auth/profile'),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>('/auth/profile', data),
};

// Medicine API
export const medicineApi = {
  search: (params: { q?: string; category?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Medicine[]>>('/medicines/search', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Medicine>>(`/medicines/${id}`),

  getAlternatives: (id: string) =>
    apiClient.get<ApiResponse<Medicine[]>>(`/medicines/${id}/alternatives`),

  getAvailability: (id: string, params?: { lat?: number; lng?: number; radius?: number }) =>
    apiClient.get<ApiResponse<(Pharmacy & Inventory)[]>>(`/medicines/${id}/availability`, { params }),

  getCategories: () =>
    apiClient.get<ApiResponse<string[]>>('/medicines/categories'),

  create: (data: Partial<Medicine>) =>
    apiClient.post<ApiResponse<Medicine>>('/medicines', data),

  update: (id: string, data: Partial<Medicine>) =>
    apiClient.put<ApiResponse<Medicine>>(`/medicines/${id}`, data),
};

// Pharmacy API
export const pharmacyApi = {
  register: (data: Partial<Pharmacy>) =>
    apiClient.post<ApiResponse<Pharmacy>>('/pharmacies/register', data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Pharmacy>>(`/pharmacies/${id}`),

  getNearby: (params: { lat: number; lng: number; radius?: number }) =>
    apiClient.get<ApiResponse<Pharmacy[]>>('/pharmacies/nearby', { params }),

  getMyPharmacy: () =>
    apiClient.get<ApiResponse<Pharmacy>>('/pharmacies/my'),

  update: (id: string, data: Partial<Pharmacy>) =>
    apiClient.put<ApiResponse<Pharmacy>>(`/pharmacies/${id}`, data),

  getInventory: (id: string, params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<ApiResponse<Inventory[]>>(`/pharmacies/${id}/inventory`, { params }),
};

// Inventory API
export const inventoryApi = {
  update: (data: { pharmacy_id: string; medicine_id: string; stock: number; price: number; expiry_date?: string }) =>
    apiClient.post<ApiResponse<Inventory>>('/inventory', data),

  bulkUpload: (pharmacyId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pharmacy_id', pharmacyId);
    return apiClient.post<ApiResponse<{ success: number; failed: number; errors: string[] }>>('/inventory/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/inventory/${id}`),
};

// Reservation API
export const reservationApi = {
  create: (data: { pharmacy_id: string; medicine_id: string; quantity: number; notes?: string }) =>
    apiClient.post<ApiResponse<Reservation>>('/reservations', data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Reservation>>(`/reservations/${id}`),

  getUserReservations: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<ApiResponse<Reservation[]>>('/reservations/user', { params }),

  getPharmacyReservations: (pharmacyId: string, params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<ApiResponse<Reservation[]>>(`/reservations/pharmacy/${pharmacyId}`, { params }),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<Reservation>>(`/reservations/${id}/status`, { status }),
};

// Admin API
export const adminApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<{ stats: DashboardStats; recentReservations: Reservation[]; topMedicines: any[] }>>('/admin/dashboard'),

  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    apiClient.get<ApiResponse<User[]>>('/admin/users', { params }),

  updateUserRole: (id: string, role: string) =>
    apiClient.put<ApiResponse<User>>(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`),

  getPharmacies: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<ApiResponse<Pharmacy[]>>('/admin/pharmacies', { params }),

  getPendingPharmacies: () =>
    apiClient.get<ApiResponse<Pharmacy[]>>('/admin/pharmacies/pending'),

  approvePharmacy: (id: string, action: 'approve' | 'reject') =>
    apiClient.patch<ApiResponse<Pharmacy>>(`/admin/pharmacies/${id}/approve`, { action }),
};
