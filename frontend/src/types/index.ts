export type UserRole = 'user' | 'pharmacy_owner' | 'admin';
export type PharmacyStatus = 'pending' | 'approved' | 'rejected';
export type ReservationStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  location_lat?: number;
  location_lng?: number;
  is_verified: boolean;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  owner_id: string;
  name: string;
  license_no: string;
  gst_no?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  status: PharmacyStatus;
  rating: number;
  total_ratings: number;
  owner_name?: string;
  owner_email?: string;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  medicine_name: string;
  generic_name?: string;
  composition?: string;
  manufacturer?: string;
  category?: string;
  alternatives: string[];
  pharmacy_count?: number;
  min_price?: number;
  max_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  stock: number;
  price: number;
  expiry_date?: string;
  updated_at: string;
  medicine_name?: string;
  generic_name?: string;
  category?: string;
  manufacturer?: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantity: number;
  status: ReservationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  medicine_name?: string;
  generic_name?: string;
  pharmacy_name?: string;
  pharmacy_address?: string;
  pharmacy_phone?: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}

export interface SearchHistory {
  id: string;
  user_id?: string;
  search_term: string;
  medicine_id?: string;
  searched_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalUsers: number;
  approvedPharmacies: number;
  totalMedicines: number;
  totalReservations: number;
  pendingPharmacies: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SearchFilters {
  query: string;
  category: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page: number;
  limit: number;
}
