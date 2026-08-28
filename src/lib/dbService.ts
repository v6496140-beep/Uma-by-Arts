import { supabase } from './supabase';
import { Service, Appointment, BusinessHours, BlockedDate, SalonSettings, AdminUser, TimeSlot } from '../types';

// Let's store a flag for whether the Supabase tables exist.
// If we hit an error indicating table not found (PG error '42P01'), we'll toggle this
// to provide a graceful local-first experience with a setup assistant banner.
let supabaseTablesExist = true;

// Default Mock/Fallback data for local-first mode when tables aren't set up yet
const DEFAULT_SETTINGS: SalonSettings = {
  id: 'default-settings-id',
  salon_name: 'AURA Hair Salon',
  salon_email: 'concierge@aurasalon.com',
  salon_phone: '+1 (555) 890-4200',
  salon_address: '420 N. Beverly Drive, Beverly Hills, CA 90210',
  slot_interval_minutes: 30,
  booking_notice_hours: 2,
};

const DEFAULT_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Signature Haircut & Style',
    description: 'A bespoke haircut including an organic essential oil wash, custom scalp massage, and expert blowout styling.',
    duration_minutes: 60,
    price: 95,
    is_active: true,
  },
  {
    id: 's2',
    name: 'Balayage & Dimensional Color',
    description: 'Custom hand-painted high/lowlights for a naturally sun-kissed, low-maintenance dimensional color transition. Includes gloss treatment.',
    duration_minutes: 150,
    price: 240,
    is_active: true,
  },
  {
    id: 's3',
    name: 'Silk Blowout & Deep Hydration',
    description: 'Rich moisture-infusing wash, deep conditioning steam mask, and smooth, high-shine signature blowout.',
    duration_minutes: 45,
    price: 65,
    is_active: true,
  },
  {
    id: 's4',
    name: 'Full Tint & Restorative Gloss',
    description: 'All-over single-process rich color from roots to ends with our organic oils-infused luxury gloss styling.',
    duration_minutes: 90,
    price: 135,
    is_active: true,
  },
  {
    id: 's5',
    name: 'Keratin Revitalizing Therapy',
    description: 'Advanced amino-acid smoothing treatment that reconstructs hair fibers, eliminates frizz, and reduces daily styling time.',
    duration_minutes: 120,
    price: 285,
    is_active: true,
  }
];

const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { id: 'b0', weekday: 0, is_open: false, start_time: '10:00', end_time: '17:00' },
  { id: 'b1', weekday: 1, is_open: false, start_time: '09:00', end_time: '18:00' },
  { id: 'b2', weekday: 2, is_open: true, start_time: '09:00', end_time: '18:00' },
  { id: 'b3', weekday: 3, is_open: true, start_time: '09:00', end_time: '18:00' },
  { id: 'b4', weekday: 4, is_open: true, start_time: '09:00', end_time: '20:00' },
  { id: 'b5', weekday: 5, is_open: true, start_time: '09:00', end_time: '20:00' },
  { id: 'b6', weekday: 6, is_open: true, start_time: '09:00', end_time: '18:00' },
];

const INITIAL_LOCAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    full_name: 'Genevieve Ross',
    email: 'genevieve.ross@gmail.com',
    phone: '310-555-0199',
    service_id: 's1',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00',
    status: 'confirmed',
    notes: 'Prefer natural products. Looking forward to refreshing my bangs.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a2',
    full_name: 'Clarissa Montgomery',
    email: 'clarissa.m@outlook.com',
    phone: '310-555-0144',
    service_id: 's2',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '13:00',
    end_time: '15:30',
    status: 'pending',
    notes: 'Would like a bright balayage contrast.',
    created_at: new Date().toISOString(),
  }
];

// Helper to check if a DB error is due to missing tables (code '42P01')
function handleDbError(error: any): boolean {
  if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation "'))) {
    if (supabaseTablesExist) {
      console.warn("Supabase tables do not exist yet. Switching to dynamic local storage engine with SQL setup helper.");
      supabaseTablesExist = false;
    }
    return true;
  }
  return false;
}

// Local storage storage keys
const L_KEYS = {
  SETTINGS: 'aura_salon_settings',
  SERVICES: 'aura_salon_services',
  HOURS: 'aura_salon_hours',
  BLOCKED: 'aura_salon_blocked',
  APPOINTMENTS: 'aura_salon_appointments',
};

function getLocal<T>(key: string, fallback: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function areSupabaseTablesMissing(): boolean {
  return !supabaseTablesExist;
}

// SQL Script for setting up Supabase
export const SETUP_SQL_SCRIPT = `-- SUPABASE SETUP SCHEMA FOR AURA HAIR SALON
-- Run this in your Supabase SQL Editor to create all necessary tables

-- 1. Services Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Salon Settings Table
CREATE TABLE IF NOT EXISTS salon_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_name TEXT NOT NULL,
  salon_email TEXT NOT NULL,
  salon_phone TEXT NOT NULL,
  salon_address TEXT NOT NULL,
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
  booking_notice_hours INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Business Hours Table
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday INTEGER NOT NULL UNIQUE CHECK (weekday BETWEEN 0 AND 6),
  is_open BOOLEAN NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- 4. Blocked Dates Table
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Services
INSERT INTO services (name, description, duration_minutes, price, is_active) VALUES
('Signature Haircut & Style', 'A bespoke haircut including an organic essential oil wash, custom scalp massage, and expert blowout styling.', 60, 95, true),
('Balayage & Dimensional Color', 'Custom hand-painted highlights/lowlights for a naturally sun-kissed transition. Includes gloss and signature blowout.', 150, 240, true),
('Silk Blowout & Deep Hydration', 'Rich moisture-infusing wash, deep conditioning steam mask, and smooth, high-shine signature blowout.', 45, 65, true),
('Full Tint & Restorative Gloss', 'All-over single-process rich color from roots to ends with our organic oils-infused luxury gloss styling.', 90, 135, true),
('Keratin Revitalizing Therapy', 'Advanced amino-acid smoothing treatment that reconstructs hair fibers, eliminates frizz, and reduces daily styling time.', 120, 285, true)
ON CONFLICT DO NOTHING;

-- Insert Default Business Hours
INSERT INTO business_hours (weekday, is_open, start_time, end_time) VALUES
(0, false, '10:00:00', '17:00:00'),
(1, false, '09:00:00', '18:00:00'),
(2, true, '09:00:00', '18:00:00'),
(3, true, '09:00:00', '18:00:00'),
(4, true, '09:00:00', '20:00:00'),
(5, true, '09:00:00', '20:00:00'),
(6, true, '09:00:00', '18:00:00')
ON CONFLICT (weekday) DO UPDATE SET is_open = EXCLUDED.is_open, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

-- Insert Default Salon Settings
INSERT INTO salon_settings (salon_name, salon_email, salon_phone, salon_address, slot_interval_minutes, booking_notice_hours) VALUES
('AURA Hair Salon', 'concierge@aurasalon.com', '+1 (555) 890-4200', '420 N. Beverly Drive, Beverly Hills, CA 90210', 30, 2)
ON CONFLICT DO NOTHING;
`;

// =========================================================
// SERVICES
// =========================================================

export async function getServices(): Promise<Service[]> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) {
        if (handleDbError(error)) return getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
        throw error;
      }
      
      // If table exists but has no entries, seed them in Supabase
      if (!data || data.length === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('services')
          .insert(DEFAULT_SERVICES.map(({ id, ...rest }) => rest))
          .select();
        if (insertError) throw insertError;
        return inserted || [];
      }
      return data;
    } catch (err: any) {
      console.error("Error fetching services from Supabase:", err);
      handleDbError(err);
    }
  }
  return getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
}

export async function createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();
      
      if (error) {
        if (handleDbError(error)) return createServiceLocal(service);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error creating service in Supabase:", err);
    }
  }
  return createServiceLocal(service);
}

function createServiceLocal(service: Omit<Service, 'id' | 'created_at'>): Service {
  const list = getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
  const newService: Service = {
    ...service,
    id: `service_${Date.now()}`,
    created_at: new Date().toISOString()
  };
  saveLocal(L_KEYS.SERVICES, [...list, newService]);
  return newService;
}

export async function updateService(id: string, updates: Partial<Omit<Service, 'id' | 'created_at'>>): Promise<Service> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (handleDbError(error)) return updateServiceLocal(id, updates);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error updating service in Supabase:", err);
    }
  }
  return updateServiceLocal(id, updates);
}

function updateServiceLocal(id: string, updates: Partial<Omit<Service, 'id' | 'created_at'>>): Service {
  const list = getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
  const index = list.findIndex(s => s.id === id);
  if (index === -1) throw new Error("Service not found");
  
  const updated = { ...list[index], ...updates };
  list[index] = updated;
  saveLocal(L_KEYS.SERVICES, list);
  return updated;
}


// =========================================================
// SALON SETTINGS
// =========================================================

export async function getSalonSettings(): Promise<SalonSettings> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('salon_settings')
        .select('*')
        .limit(1);
      
      if (error) {
        if (handleDbError(error)) return getLocal<SalonSettings>(L_KEYS.SETTINGS, DEFAULT_SETTINGS);
        throw error;
      }
      
      if (!data || data.length === 0) {
        // Seed first
        const { data: inserted, error: insertError } = await supabase
          .from('salon_settings')
          .insert(DEFAULT_SETTINGS)
          .select()
          .single();
        if (insertError) {
          // If insert fails, just return default
          return DEFAULT_SETTINGS;
        }
        return inserted;
      }
      return data[0];
    } catch (err) {
      console.error("Error fetching settings from Supabase:", err);
      handleDbError(err);
    }
  }
  return getLocal<SalonSettings>(L_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function updateSalonSettings(id: string, updates: Partial<Omit<SalonSettings, 'id' | 'created_at'>>): Promise<SalonSettings> {
  if (supabaseTablesExist) {
    try {
      // If we don't have an ID or id is a local-only placeholder, let's look up setting
      const { data: current } = await supabase.from('salon_settings').select('id').limit(1);
      const targetId = current && current.length > 0 ? current[0].id : id;

      const { data, error } = await supabase
        .from('salon_settings')
        .update(updates)
        .eq('id', targetId)
        .select()
        .single();
      
      if (error) {
        if (handleDbError(error)) return updateSettingsLocal(updates);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error updating settings in Supabase:", err);
    }
  }
  return updateSettingsLocal(updates);
}

function updateSettingsLocal(updates: Partial<Omit<SalonSettings, 'id' | 'created_at'>>): SalonSettings {
  const current = getLocal<SalonSettings>(L_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const updated = { ...current, ...updates };
  saveLocal(L_KEYS.SETTINGS, updated);
  return updated;
}


// =========================================================
// BUSINESS HOURS
// =========================================================

export async function getBusinessHours(): Promise<BusinessHours[]> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('weekday');
      
      if (error) {
        if (handleDbError(error)) return getLocal<BusinessHours[]>(L_KEYS.HOURS, DEFAULT_BUSINESS_HOURS);
        throw error;
      }
      
      if (!data || data.length === 0) {
        const payload = DEFAULT_BUSINESS_HOURS.map(({ id, ...rest }) => rest);
        const { data: inserted, error: insertError } = await supabase
          .from('business_hours')
          .insert(payload)
          .select();
        if (insertError) throw insertError;
        return inserted || [];
      }
      return data;
    } catch (err) {
      console.error("Error getting business hours from Supabase:", err);
      handleDbError(err);
    }
  }
  return getLocal<BusinessHours[]>(L_KEYS.HOURS, DEFAULT_BUSINESS_HOURS);
}

export async function updateBusinessHours(id: string, updates: Partial<Omit<BusinessHours, 'id'>>): Promise<BusinessHours> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (handleDbError(error)) return updateBusinessHoursLocal(id, updates);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error updating business hours in Supabase:", err);
    }
  }
  return updateBusinessHoursLocal(id, updates);
}

function updateBusinessHoursLocal(id: string, updates: Partial<Omit<BusinessHours, 'id'>>): BusinessHours {
  const list = getLocal<BusinessHours[]>(L_KEYS.HOURS, DEFAULT_BUSINESS_HOURS);
  const index = list.findIndex(b => b.id === id);
  if (index === -1) throw new Error("Business hours record not found");
  
  const updated = { ...list[index], ...updates };
  list[index] = updated;
  saveLocal(L_KEYS.HOURS, list);
  return updated;
}


// =========================================================
// BLOCKED DATES
// =========================================================

export async function getBlockedDates(): Promise<BlockedDate[]> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('blocked_date');
      
      if (error) {
        if (handleDbError(error)) return getLocal<BlockedDate[]>(L_KEYS.BLOCKED, []);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error("Error getting blocked dates from Supabase:", err);
      handleDbError(err);
    }
  }
  return getLocal<BlockedDate[]>(L_KEYS.BLOCKED, []);
}

export async function addBlockedDate(blocked_date: string, reason: string | null): Promise<BlockedDate> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .insert({ blocked_date, reason })
        .select()
        .single();
      
      if (error) {
        if (handleDbError(error)) return addBlockedDateLocal(blocked_date, reason);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error adding blocked date in Supabase:", err);
    }
  }
  return addBlockedDateLocal(blocked_date, reason);
}

function addBlockedDateLocal(blocked_date: string, reason: string | null): BlockedDate {
  const list = getLocal<BlockedDate[]>(L_KEYS.BLOCKED, []);
  // Avoid duplicate blocked date
  const filtered = list.filter(b => b.blocked_date !== blocked_date);
  const newBlocked: BlockedDate = {
    id: `block_${Date.now()}`,
    blocked_date,
    reason,
    created_at: new Date().toISOString()
  };
  saveLocal(L_KEYS.BLOCKED, [...filtered, newBlocked]);
  return newBlocked;
}

export async function removeBlockedDate(id: string): Promise<boolean> {
  if (supabaseTablesExist) {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (handleDbError(error)) return removeBlockedDateLocal(id);
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Error removing blocked date in Supabase:", err);
    }
  }
  return removeBlockedDateLocal(id);
}

function removeBlockedDateLocal(id: string): boolean {
  const list = getLocal<BlockedDate[]>(L_KEYS.BLOCKED, []);
  const filtered = list.filter(b => b.id !== id);
  saveLocal(L_KEYS.BLOCKED, filtered);
  return true;
}


// =========================================================
// APPOINTMENTS
// =========================================================

export async function getAppointments(): Promise<Appointment[]> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(*)
        `)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        if (handleDbError(error)) return getAppointmentsLocal();
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error("Error getting appointments from Supabase:", err);
      handleDbError(err);
    }
  }
  return getAppointmentsLocal();
}

function getAppointmentsLocal(): Appointment[] {
  const appointments = getLocal<Appointment[]>(L_KEYS.APPOINTMENTS, INITIAL_LOCAL_APPOINTMENTS);
  const services = getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
  return appointments.map(app => ({
    ...app,
    service: services.find(s => s.id === app.service_id)
  }));
}

export async function createAppointment(appointment: Omit<Appointment, 'id' | 'status' | 'created_at'>): Promise<Appointment> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointment,
          status: 'pending'
        })
        .select(`
          *,
          service:services(*)
        `)
        .single();
      
      if (error) {
        if (handleDbError(error)) return createAppointmentLocal(appointment);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error creating appointment in Supabase:", err);
    }
  }
  return createAppointmentLocal(appointment);
}

function createAppointmentLocal(appointment: Omit<Appointment, 'id' | 'status' | 'created_at'>): Appointment {
  const list = getLocal<Appointment[]>(L_KEYS.APPOINTMENTS, INITIAL_LOCAL_APPOINTMENTS);
  const newAppointment: Appointment = {
    ...appointment,
    id: `app_${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  saveLocal(L_KEYS.APPOINTMENTS, [...list, newAppointment]);
  
  const services = getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
  return {
    ...newAppointment,
    service: services.find(s => s.id === appointment.service_id)
  };
}

export async function updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          service:services(*)
        `)
        .single();
      
      if (error) {
        if (handleDbError(error)) return updateAppointmentStatusLocal(id, status);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error updating appointment status in Supabase:", err);
    }
  }
  return updateAppointmentStatusLocal(id, status);
}

function updateAppointmentStatusLocal(id: string, status: Appointment['status']): Appointment {
  const list = getLocal<Appointment[]>(L_KEYS.APPOINTMENTS, INITIAL_LOCAL_APPOINTMENTS);
  const index = list.findIndex(a => a.id === id);
  if (index === -1) throw new Error("Appointment not found");
  
  list[index].status = status;
  saveLocal(L_KEYS.APPOINTMENTS, list);
  
  const services = getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
  return {
    ...list[index],
    service: services.find(s => s.id === list[index].service_id)
  };
}


// =========================================================
// ADMIN AUTHENTICATION
// =========================================================

export async function checkAdminUser(userId: string): Promise<boolean> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        if (handleDbError(error)) return true; // Fail-open locally if table is missing so we can demonstrate UI
        throw error;
      }
      return data && data.length > 0;
    } catch (err) {
      console.error("Error checking admin user in Supabase:", err);
      if (handleDbError(err)) return true;
      return false;
    }
  }
  return true; // Local bypass when tables aren't configured yet (allows preview testing)
}


// =========================================================
// AVAILABILITY TIME SLOT GENERATOR LOGIC
// =========================================================

/**
 * Available time slots must be generated using:
 * - business_hours
 * - services.duration_minutes
 * - salon_settings.slot_interval_minutes
 * - salon_settings.booking_notice_hours
 * - blocked_dates
 * - existing appointments
 */
export async function getAvailableSlots(service: Service, dateStr: string): Promise<TimeSlot[]> {
  const settings = await getSalonSettings();
  const businessHoursList = await getBusinessHours();
  const blockedDates = await getBlockedDates();
  const appointments = await getAppointments();

  const selectedDate = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // 1. Skip blocked dates
  const isBlocked = blockedDates.some(b => b.blocked_date === dateStr);
  if (isBlocked) {
    return [];
  }

  // 2. Get active business hours for this day of week
  const dayHours = businessHoursList.find(bh => bh.weekday === dayOfWeek);
  if (!dayHours || !dayHours.is_open) {
    return [];
  }

  // 3. Format helper to combine date and time strings safely
  // Parse 'HH:MM:SS' or 'HH:MM' into minutes since midnight
  const parseTimeToMinutes = (timeStr: string) => {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const startMinutes = parseTimeToMinutes(dayHours.start_time);
  const endMinutes = parseTimeToMinutes(dayHours.end_time);

  // 4. Set up Booking Notice constraints
  // Convert now into current local time zone relative parameters
  const now = new Date();
  const bookingNoticeMs = settings.booking_notice_hours * 60 * 60 * 1000;
  const earliestAllowedTime = new Date(now.getTime() + bookingNoticeMs);

  // Filter appointments for this date (excluding cancelled ones)
  const activeAppointmentsOnDate = appointments.filter(app => {
    return app.appointment_date === dateStr && app.status !== 'cancelled';
  });

  const slots: TimeSlot[] = [];
  const interval = settings.slot_interval_minutes;
  const duration = service.duration_minutes;

  // Let's generate potential slots
  // A slot is available starting at current_time and ending at current_time + service.duration
  for (let current = startMinutes; current + duration <= endMinutes; current += interval) {
    // Convert minutes to HH:MM format
    const startHour = Math.floor(current / 60);
    const startMin = current % 60;
    const endHour = Math.floor((current + duration) / 60);
    const endMin = (current + duration) % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    // Create real Date objects safely to prevent invalid format warnings
    const slotStartDate = new Date(`${dateStr}T${pad(startHour)}:${pad(startMin)}:00`);
    const slotEndDate = new Date(`${dateStr}T${pad(endHour)}:${pad(endMin)}:00`);

    // Rule: Respect booking notice time (must be after earliest allowed time)
    if (slotStartDate < earliestAllowedTime) {
      continue;
    }

    // Rule: Skip overlapping appointments
    // Overlap rule: new_start < existing_end AND new_end > existing_start
    let hasOverlap = false;
    for (const app of activeAppointmentsOnDate) {
      const appStartMin = parseTimeToMinutes(app.start_time);
      const appEndMin = parseTimeToMinutes(app.end_time);
      const newStartMin = current;
      const newEndMin = current + duration;

      if (newStartMin < appEndMin && newEndMin > appStartMin) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      // Format label like "09:30 AM" or "02:00 PM"
      const hour12 = startHour % 12 || 12;
      const ampm = startHour >= 12 ? 'PM' : 'AM';
      const label = `${hour12}:${pad(startMin)} ${ampm}`;

      slots.push({
        start: slotStartDate,
        end: slotEndDate,
        label,
      });
    }
  }

  return slots;
}
