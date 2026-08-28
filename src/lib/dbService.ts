import { supabase } from './supabase';
import { Service, Appointment, BusinessHours, BlockedDate, SalonSettings, AdminUser, TimeSlot, Staff } from '../types';

// Let's store a flag for whether the Supabase tables exist.
// If we hit an error indicating table not found (PG error '42P01'), we'll toggle this
// to provide a graceful local-first experience with a setup assistant banner.
let supabaseTablesExist = true;

// Default Mock/Fallback data for local-first mode when tables aren't set up yet
const DEFAULT_SETTINGS: SalonSettings = {
  id: 'default-settings-id',
  salon_name: 'Raj Hair Studio',
  salon_email: 'concierge@rajhairstudio.in',
  salon_phone: '+91 98765 43210',
  salon_address: 'C-Scheme, Near Statue Circle, Jaipur, Rajasthan 302005',
  slot_interval_minutes: 30,
  booking_notice_hours: 2,
};

const DEFAULT_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Haircut',
    description: 'Precision haircut customized to your face shape, including herbal shampoo wash and expert styling finish.',
    category: 'Hair Services',
    duration_minutes: 45,
    price: 399,
    is_active: true,
  },
  {
    id: 's2',
    name: 'Hair Styling',
    description: 'Professional blow-dry, curling, or sleek iron styling for parties, events, and festive occasions.',
    category: 'Hair Services',
    duration_minutes: 45,
    price: 599,
    is_active: true,
  },
  {
    id: 's3',
    name: 'Beard Trim',
    description: 'Expert beard shaping, mustache detailing, hot towel herbal steam, and beard oil conditioning.',
    category: 'Grooming & Beard',
    duration_minutes: 30,
    price: 299,
    is_active: true,
  },
  {
    id: 's4',
    name: 'Hair Wash',
    description: 'Rejuvenating hair wash with organic herbal shampoo and scalp conditioning.',
    category: 'Hair Services',
    duration_minutes: 20,
    price: 249,
    is_active: true,
  },
  {
    id: 's5',
    name: 'Hair Spa',
    description: 'Intensive botanical oil nourishment treatment to repair damaged hair, reduce hairfall, and revitalize scalp.',
    category: 'Hair Services',
    duration_minutes: 60,
    price: 999,
    is_active: true,
  },
  {
    id: 's6',
    name: 'Hair Coloring',
    description: 'Global hair coloring or root touch-up with ammonia-free professional organic pigments.',
    category: 'Hair Services',
    duration_minutes: 90,
    price: 1499,
    is_active: true,
  },
  {
    id: 's7',
    name: 'Hair Smoothening',
    description: 'Advanced protein smoothening treatment that eliminates frizz, adds mirror-like shine, and manages unruly hair.',
    category: 'Hair Services',
    duration_minutes: 150,
    price: 3499,
    is_active: true,
  },
  {
    id: 's8',
    name: 'Hair Straightening',
    description: 'Permanent or rebonding hair straightening for silky, straight, manageable hair with long-lasting effect.',
    category: 'Hair Services',
    duration_minutes: 180,
    price: 3999,
    is_active: true,
  },
  {
    id: 's9',
    name: 'Facial',
    description: 'Deep cleansing, exfoliating herbal facial to restore natural skin glow, hydration, and radiance.',
    category: 'Skin & Facial',
    duration_minutes: 60,
    price: 1199,
    is_active: true,
  },
  {
    id: 's10',
    name: 'Head Massage',
    description: 'Relaxing Ayurvedic champi head massage with warm herbal oils to relieve stress and improve circulation.',
    category: 'Spa & Wellness',
    duration_minutes: 30,
    price: 399,
    is_active: true,
  },
  {
    id: 's11',
    name: 'Bridal Makeup',
    description: 'Complete luxury bridal makeover for weddings and grand celebrations by certified celebrity makeup artists.',
    category: 'Bridal & Makeup',
    duration_minutes: 120,
    price: 4999,
    is_active: true,
  },
  {
    id: 's12',
    name: 'Groom Makeup',
    description: 'Specialized subtle groom makeover, skin prep, and hair styling for weddings and special occasions.',
    category: 'Bridal & Makeup',
    duration_minutes: 60,
    price: 2499,
    is_active: true,
  }
];

const DEFAULT_STAFF: Staff[] = [
  {
    id: 'st1',
    name: 'Vikram Singh',
    role: 'Master Stylist & Director',
    experience: '12+ Years Experience',
    specialty: 'Precision Cuts & Advanced Styling',
    bio: 'Renowned across Jaipur for bespoke precision haircuts and contemporary styling tailored to individual face structures.',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    is_active: true,
  },
  {
    id: 'st2',
    name: 'Ananya Sharma',
    role: 'Senior Bridal Makeup Artist',
    experience: '9+ Years Experience',
    specialty: 'Bridal Makeovers & Airbrush',
    bio: 'Certified celebrity makeup artist specializing in flawless bridal looks, traditional aesthetics, and skin preps.',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    is_active: true,
  },
  {
    id: 'st3',
    name: 'Rohit Meena',
    role: 'Hair Color & Treatment Specialist',
    experience: '8+ Years Experience',
    specialty: 'Balayage, Keratin & Smoothening',
    bio: 'Expert in ammonia-free organic hair coloring, complex balayage techniques, and deep restorative hair spa therapies.',
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    is_active: true,
  },
  {
    id: 'st4',
    name: 'Pooja Rathore',
    role: 'Skin & Wellness Expert',
    experience: '7+ Years Experience',
    specialty: 'Herbal Facials & Ayurvedic Therapies',
    bio: 'Dedicated to skin rejuvenation, radiant herbal facials, and relaxing Ayurvedic head massage rituals.',
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    is_active: true,
  }
];

const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { id: 'b0', weekday: 0, is_open: true, start_time: '10:00', end_time: '20:00' },
  { id: 'b1', weekday: 1, is_open: true, start_time: '09:30', end_time: '20:30' },
  { id: 'b2', weekday: 2, is_open: true, start_time: '09:30', end_time: '20:30' },
  { id: 'b3', weekday: 3, is_open: true, start_time: '09:30', end_time: '20:30' },
  { id: 'b4', weekday: 4, is_open: true, start_time: '09:30', end_time: '20:30' },
  { id: 'b5', weekday: 5, is_open: true, start_time: '09:30', end_time: '21:00' },
  { id: 'b6', weekday: 6, is_open: true, start_time: '09:30', end_time: '21:00' },
];

const INITIAL_LOCAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    full_name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 98765 11223',
    service_id: 's1',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '10:30',
    end_time: '11:15',
    status: 'confirmed',
    notes: 'Classic haircut with side fade and herbal wash.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a2',
    full_name: 'Priya Verma',
    email: 'priya.verma@gmail.com',
    phone: '+91 98765 44556',
    service_id: 's3',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '15:00',
    status: 'pending',
    notes: 'Advanced hair spa and deep conditioning treatment.',
    created_at: new Date().toISOString(),
  }
];


// Helper to check if a DB error is due to missing tables (code '42P01' or 'PGRST205') or RLS policies (code '42501')
function handleDbError(error: any): boolean {
  if (error && (
    error.code === '42P01' || 
    error.code === 'PGRST205' || 
    error.code === '42501' || 
    error.message?.includes('does not exist') || 
    error.message?.includes('relation "') || 
    error.message?.includes('Could not find') ||
    error.message?.includes('schema cache') ||
    error.message?.includes('row-level security')
  )) {
    if (supabaseTablesExist) {
      console.warn("Supabase tables missing or Row Level Security (RLS) is blocking inserts. Switching to dynamic local storage engine with SQL setup helper.");
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
  STAFF: 'aura_salon_staff',
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

-- Disable Row Level Security (RLS) on all tables to allow client-side anonymous operations without policy violations
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE salon_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
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

export async function deleteService(id: string): Promise<boolean> {
  if (supabaseTablesExist) {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (handleDbError(error)) return deleteServiceLocal(id);
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Error deleting service from Supabase:", err);
      throw err;
    }
  }
  return deleteServiceLocal(id);
}

function deleteServiceLocal(id: string): boolean {
  const list = getLocal<Service[]>(L_KEYS.SERVICES, DEFAULT_SERVICES);
  const filtered = list.filter(s => s.id !== id);
  saveLocal(L_KEYS.SERVICES, filtered);
  return true;
}


// =========================================================
// STAFF / ARTISTS
// =========================================================

export async function getStaff(): Promise<Staff[]> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name');
      if (error) {
        if (handleDbError(error)) return getLocal<Staff[]>(L_KEYS.STAFF, DEFAULT_STAFF);
        throw error;
      }
      if (!data || data.length === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('staff')
          .insert(DEFAULT_STAFF.map(({ id, ...rest }) => rest))
          .select();
        if (insertError) throw insertError;
        return inserted || DEFAULT_STAFF;
      }
      return data;
    } catch (err: any) {
      return getLocal<Staff[]>(L_KEYS.STAFF, DEFAULT_STAFF);
    }
  }
  return getLocal<Staff[]>(L_KEYS.STAFF, DEFAULT_STAFF);
}

export async function createStaff(newStaff: Omit<Staff, 'id' | 'created_at'>): Promise<Staff> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert(newStaff)
        .select()
        .single();
      if (error) {
        if (handleDbError(error)) return createStaffLocal(newStaff);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error creating staff in Supabase:", err);
    }
  }
  return createStaffLocal(newStaff);
}

function createStaffLocal(newStaff: Omit<Staff, 'id' | 'created_at'>): Staff {
  const list = getLocal<Staff[]>(L_KEYS.STAFF, DEFAULT_STAFF);
  const created: Staff = { ...newStaff, id: 'st_' + Date.now() };
  list.push(created);
  saveLocal(L_KEYS.STAFF, list);
  return created;
}

export async function updateStaff(id: string, updates: Partial<Omit<Staff, 'id' | 'created_at'>>): Promise<Staff> {
  if (supabaseTablesExist) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (handleDbError(error)) return updateStaffLocal(id, updates);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Error updating staff in Supabase:", err);
    }
  }
  return updateStaffLocal(id, updates);
}

function updateStaffLocal(id: string, updates: Partial<Omit<Staff, 'id' | 'created_at'>>): Staff {
  const list = getLocal<Staff[]>(L_KEYS.STAFF, DEFAULT_STAFF);
  const index = list.findIndex(s => s.id === id);
  if (index === -1) throw new Error("Staff not found");
  const updated = { ...list[index], ...updates };
  list[index] = updated;
  saveLocal(L_KEYS.STAFF, list);
  return updated;
}

export async function deleteStaff(id: string): Promise<boolean> {
  if (supabaseTablesExist) {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
      if (error) {
        if (handleDbError(error)) return deleteStaffLocal(id);
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Error deleting staff from Supabase:", err);
      throw err;
    }
  }
  return deleteStaffLocal(id);
}

function deleteStaffLocal(id: string): boolean {
  const list = getLocal<Staff[]>(L_KEYS.STAFF, DEFAULT_STAFF);
  const filtered = list.filter(s => s.id !== id);
  saveLocal(L_KEYS.STAFF, filtered);
  return true;
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

/**
 * Creates and inserts a realistic sample appointment into the Supabase database (or local fallback)
 * to simplify UI testing, booking workflow validation, and dashboard simulation.
 */
export async function createSampleAppointment(customData?: Partial<Omit<Appointment, 'id' | 'created_at'>>): Promise<Appointment> {
  // Get existing services to assign a valid service_id
  const services = await getServices();
  const selectedService = services.find(s => s.is_active) || DEFAULT_SERVICES[0];
  const serviceId = customData?.service_id || selectedService.id;

  const names = ["Evelyn Dubois", "Victoria Vance", "Isabella Sterling", "Marcus Thorne", "Alexander Mercer"];
  const emails = ["evelyn.d@example.com", "v.vance@example.com", "isabella.s@example.com", "m.thorne@example.com", "a.mercer@example.com"];
  const phones = ["310-555-0102", "310-555-0188", "310-555-0145", "310-555-0111", "310-555-0130"];
  const notesList = [
    "First-time client. Looking for a fresh look that is easy to maintain.",
    "Prefers organic, fragrance-free styling products.",
    "Would love some advice on protecting colored hair.",
    "Requires a quiet, relaxing session if possible.",
    "Needs a fast blowout, has an evening event afterwards."
  ];

  const randomIndex = Math.floor(Math.random() * names.length);

  // Set default sample details
  const todayStr = new Date().toISOString().split('T')[0];
  const sampleAppointment: Omit<Appointment, 'id' | 'created_at'> = {
    full_name: customData?.full_name || names[randomIndex],
    email: customData?.email || emails[randomIndex],
    phone: customData?.phone || phones[randomIndex],
    service_id: serviceId,
    appointment_date: customData?.appointment_date || todayStr,
    start_time: customData?.start_time || "11:30",
    end_time: customData?.end_time || "12:30",
    status: customData?.status || "confirmed",
    notes: customData?.notes || notesList[randomIndex],
  };

  return createAppointment(sampleAppointment);
}

