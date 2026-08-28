export interface Service {
  id: string;
  name: string;
  description: string | null;
  category?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at?: string;
}

export interface Appointment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS or HH:MM
  end_time: string; // HH:MM:SS or HH:MM
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at?: string;
  service?: Service; // Joined from services
}

export interface BusinessHours {
  id: string;
  weekday: number; // 0 = Sunday, 1 = Monday, etc.
  is_open: boolean;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export interface BlockedDate {
  id: string;
  blocked_date: string; // YYYY-MM-DD
  reason: string | null;
  created_at?: string;
}

export interface SalonSettings {
  id: string;
  salon_name: string;
  salon_email: string;
  salon_phone: string;
  salon_address: string;
  slot_interval_minutes: number;
  booking_notice_hours: number;
  created_at?: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  created_at?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  experience: string;
  specialty: string;
  bio: string;
  image_url: string;
  is_active: boolean;
  created_at?: string;
}
