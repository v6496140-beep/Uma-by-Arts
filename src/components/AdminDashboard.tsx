import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  getAppointments, 
  getServices, 
  getStaff,
  getBusinessHours, 
  getBlockedDates, 
  getSalonSettings,
  updateAppointmentStatus,
  createService,
  updateService,
  deleteService,
  createStaff,
  updateStaff,
  deleteStaff,
  updateBusinessHours,
  addBlockedDate,
  removeBlockedDate,
  updateSalonSettings,
  areSupabaseTablesMissing,
  createSampleAppointment
} from '../lib/dbService';
import { Service, Appointment, BusinessHours, BlockedDate, SalonSettings, Staff } from '../types';
import { BookingTrendsChart } from './BookingTrendsChart';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Clock, 
  CalendarOff, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Check, 
  X, 
  Trash2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShieldAlert,
  Search,
  Filter,
  Eye,
  EyeOff,
  Briefcase,
  Sliders,
  UserCheck,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'overview' | 'appointments' | 'services' | 'staff' | 'hours' | 'blocked' | 'settings';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [salonName, setSalonName] = useState('AURA Hair Salon');

  // Core DB States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<SalonSettings | null>(null);

  // Load States & UI feedbacks
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter state for appointments page
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals / Drawer States
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    service: Partial<Service> | null;
  }>({ isOpen: false, mode: 'add', service: null });

  const [staffModal, setStaffModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    staffMember: Partial<Staff> | null;
  }>({ isOpen: false, mode: 'add', staffMember: null });

  const [blockDateModal, setBlockDateModal] = useState({
    isOpen: false,
    dateStr: '',
    reason: ''
  });

  // Load all dashboard records from Supabase
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [allApps, allServs, allStaff, hours, blocks, salonConf] = await Promise.all([
        getAppointments(),
        getServices(),
        getStaff(),
        getBusinessHours(),
        getBlockedDates(),
        getSalonSettings()
      ]);

      setAppointments(allApps);
      setServices(allServs);
      setStaff(allStaff);
      setBusinessHours(hours);
      setBlockedDates(blocks);
      setSettings(salonConf);
      if (salonConf) {
        setSalonName(salonConf.salon_name);
      }
    } catch (err) {
      console.error('Error loading admin records', err);
      showToast('error', 'Failed to retrieve live database values.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Utility to show beautiful temporary dashboard toast notifications
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const getMonthlyRevenue = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return appointments
      .filter(app => {
        if (app.status !== 'completed') return false;
        const appDate = new Date(app.appointment_date + 'T00:00:00');
        return appDate.getFullYear() === currentYear && appDate.getMonth() === currentMonth;
      })
      .reduce((sum, app) => {
        const price = app.service?.price ?? services.find(s => s.id === app.service_id)?.price ?? 0;
        return sum + price;
      }, 0);
  };

  const getRevenueLast30Days = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA');

    return appointments
      .filter(app => {
        if (app.status !== 'completed') return false;
        return app.appointment_date >= thirtyDaysAgoStr;
      })
      .reduce((sum, app) => {
        const price = app.service?.price ?? services.find(s => s.id === app.service_id)?.price ?? 0;
        return sum + price;
      }, 0);
  };

  // =========================================================
  // ACTIONS - APPOINTMENTS
  // =========================================================
  const handleUpdateStatus = async (appId: string, status: Appointment['status']) => {
    try {
      const updated = await updateAppointmentStatus(appId, status);
      if (updated) {
        setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
        showToast('success', `Appointment marked as ${status} successfully.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not update status.');
    }
  };

  const handleInsertSampleAppointment = async () => {
    try {
      const newApp = await createSampleAppointment();
      if (newApp) {
        const allApps = await getAppointments();
        setAppointments(allApps);
        showToast('success', `Simulated test appointment for ${newApp.full_name} created successfully!`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not generate simulated appointment.');
    }
  };

  // =========================================================
  // ACTIONS - SERVICES
  // =========================================================
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = serviceModal.service;
    if (!s || !s.name || s.duration_minutes === undefined || s.price === undefined) {
      showToast('error', 'Please fill out all required service fields.');
      return;
    }

    try {
      if (serviceModal.mode === 'add') {
        const payload = {
          name: s.name,
          description: s.description || null,
          duration_minutes: Number(s.duration_minutes),
          price: Number(s.price),
          is_active: s.is_active ?? true
        };
        const created = await createService(payload);
        if (created) {
          setServices(prev => [created, ...prev]);
          showToast('success', `New service "${s.name}" created successfully.`);
        }
      } else {
        const payload = {
          name: s.name,
          description: s.description || null,
          duration_minutes: Number(s.duration_minutes),
          price: Number(s.price),
          is_active: s.is_active ?? true
        };
        const updated = await updateService(s.id!, payload);
        if (updated) {
          setServices(prev => prev.map(item => item.id === s.id ? updated : item));
          showToast('success', `Service "${s.name}" updated successfully.`);
        }
      }
      setServiceModal({ isOpen: false, mode: 'add', service: null });
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not save service.');
    }
  };

  const handleToggleServiceActive = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await updateService(id, { is_active: !currentStatus });
      if (updated) {
        setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
        showToast('success', `Service ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not update service status.');
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the service "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const success = await deleteService(id);
      if (success) {
        setServices(prev => prev.filter(s => s.id !== id));
        showToast('success', `Service "${name}" was successfully removed.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not delete service. It may be referenced by existing appointments.');
    }
  };

  // =========================================================
  // ACTIONS - STAFF (MEET OUR ARTISTS)
  // =========================================================
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = staffModal.staffMember;
    if (!st || !st.name || !st.role) {
      showToast('error', 'Please fill out artist name and role.');
      return;
    }

    try {
      if (staffModal.mode === 'add') {
        const payload = {
          name: st.name,
          role: st.role,
          experience: st.experience || '5+ Years Experience',
          specialty: st.specialty || 'Hair Styling',
          image_url: st.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          bio: st.bio || 'Professional salon stylist.',
          is_active: st.is_active ?? true
        };
        const created = await createStaff(payload);
        if (created) {
          setStaff(prev => [created, ...prev]);
          showToast('success', `Artist "${st.name}" added successfully.`);
        }
      } else {
        const payload = {
          name: st.name,
          role: st.role,
          experience: st.experience || '5+ Years Experience',
          specialty: st.specialty || 'Hair Styling',
          image_url: st.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          bio: st.bio || 'Professional salon stylist.',
          is_active: st.is_active ?? true
        };
        const updated = await updateStaff(st.id!, payload);
        if (updated) {
          setStaff(prev => prev.map(item => item.id === st.id ? updated : item));
          showToast('success', `Artist "${st.name}" updated successfully.`);
        }
      }
      setStaffModal({ isOpen: false, mode: 'add', staffMember: null });
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not save artist profile.');
    }
  };

  const handleToggleStaffActive = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await updateStaff(id, { is_active: !currentStatus });
      if (updated) {
        setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
        showToast('success', `Artist profile visibility updated.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not update staff status.');
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove artist "${name}" from the salon team?`)) {
      return;
    }
    try {
      const success = await deleteStaff(id);
      if (success) {
        setStaff(prev => prev.filter(s => s.id !== id));
        showToast('success', `Artist "${name}" removed.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not delete staff member.');
    }
  };


  // =========================================================
  // ACTIONS - BUSINESS HOURS
  // =========================================================
  const handleHourToggle = async (id: string, isOpen: boolean) => {
    try {
      const updated = await updateBusinessHours(id, { is_open: isOpen });
      if (updated) {
        setBusinessHours(prev => prev.map(bh => bh.id === id ? { ...bh, is_open: isOpen } : bh));
        showToast('success', `Hours configured successfully.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to update schedule hours.');
    }
  };

  const handleHourTimeChange = async (id: string, type: 'start' | 'end', value: string) => {
    try {
      const payload = type === 'start' ? { start_time: value } : { end_time: value };
      const updated = await updateBusinessHours(id, payload);
      if (updated) {
        setBusinessHours(prev => prev.map(bh => bh.id === id ? { ...bh, ...payload } : bh));
        showToast('success', `Time range updated.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save time.');
    }
  };

  // =========================================================
  // ACTIONS - BLOCKED DATES
  // =========================================================
  const handleAddBlockedDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDateModal.dateStr) return;

    try {
      const added = await addBlockedDate(blockDateModal.dateStr, blockDateModal.reason || null);
      if (added) {
        setBlockedDates(prev => [added, ...prev].sort((a,b) => a.blocked_date.localeCompare(b.blocked_date)));
        showToast('success', `Date "${blockDateModal.dateStr}" blocked successfully.`);
        setBlockDateModal({ isOpen: false, dateStr: '', reason: '' });
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not block date.');
    }
  };

  const handleRemoveBlockedDate = async (id: string, dateLabel: string) => {
    try {
      const success = await removeBlockedDate(id);
      if (success) {
        setBlockedDates(prev => prev.filter(b => b.id !== id));
        showToast('success', `Date "${dateLabel}" is now open.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not open date.');
    }
  };

  // =========================================================
  // ACTIONS - SALON SETTINGS
  // =========================================================
  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const payload = {
        salon_name: settings.salon_name,
        salon_email: settings.salon_email,
        salon_phone: settings.salon_phone,
        salon_address: settings.salon_address,
        slot_interval_minutes: Number(settings.slot_interval_minutes),
        booking_notice_hours: Number(settings.booking_notice_hours)
      };

      const updated = await updateSalonSettings(settings.id, payload);
      if (updated) {
        setSettings(updated);
        setSalonName(updated.salon_name);
        showToast('success', 'Salon configurations saved successfully.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to update settings in database.');
    }
  };


  // Filtering appointments for search list
  const getFilteredAppointments = () => {
    return appointments.filter(app => {
      const matchesSearch = 
        app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phone.includes(searchQuery) ||
        (app.service?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesDate = !dateFilter || app.appointment_date === dateFilter;
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  // Helper date formatter
  const formatDateStr = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-[85vh] bg-[#F8F5F1] flex flex-col lg:flex-row border border-[#EAE3D9]/50 rounded-2xl shadow-xl overflow-hidden relative">
      
      {/* Toast Alert System */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-slide-in flex items-center gap-2 ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {toastMsg.type === 'success' ? '✓' : '⚠️'}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#7C6A53] text-white shrink-0 flex flex-col justify-between border-r border-[#EAE3D9]/10">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-[#EAE3D9]/10">
            <span className="text-[10px] uppercase tracking-widest text-[#A68A64] font-bold">Admin Workspace</span>
            <h3 className="font-serif-display text-xl font-bold tracking-wide mt-1 line-clamp-1 text-white">
              {salonName}
            </h3>
            {areSupabaseTablesMissing() && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F8F5F1]/10 text-[#A68A64]">
                Local Storage Mode
              </span>
            )}
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'overview', label: 'Console Overview', icon: LayoutDashboard },
              { id: 'appointments', label: 'Client Visits', icon: Calendar },
              { id: 'services', label: 'Ritual Services', icon: Scissors },
              { id: 'staff', label: 'Meet Our Artists', icon: Users },
              { id: 'hours', label: 'Business Hours', icon: Clock },
              { id: 'blocked', label: 'Blocked Dates', icon: CalendarOff },
              { id: 'settings', label: 'Salon Settings', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#A68A64] text-white font-bold shadow-md'
                      : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Block & Logout */}
        <div className="p-4 border-t border-[#EAE3D9]/10">
          <div className="flex items-center gap-3 p-2 bg-[#F8F5F1]/5 rounded-lg mb-3">
            <div className="w-8 h-8 rounded-full bg-[#A68A64] text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
              M
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Manager</p>
              <p className="text-[10px] text-[#EAE3D9]/60 truncate max-w-[130px]">concierge@aurasalon.com</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-400/30 text-red-200 hover:bg-red-500/10 hover:text-red-100 transition-all font-semibold text-xs uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[85vh]">

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          loading ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-3 bg-[#7C6A53]/20 rounded w-48"></div>
                  <div className="h-8 bg-[#2C2621]/20 rounded w-64"></div>
                </div>
                <div className="h-8 bg-white border border-[#EAE3D9]/40 rounded-lg w-36"></div>
              </div>

              {/* Skeletons for Metric Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white border border-[#EAE3D9]/40 p-5 rounded-xl shadow-sm flex items-center justify-between">
                    <div className="space-y-2.5 w-full">
                      <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                      <div className="h-7 bg-neutral-300 rounded w-1/3"></div>
                      <div className="h-2.5 bg-neutral-200 rounded w-3/4"></div>
                    </div>
                    <div className="p-3 bg-neutral-100 rounded-lg text-neutral-300">
                      <div className="w-5 h-5 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* D3 Booking Trends Chart Section */}
              <div className="bg-white border border-[#EAE3D9]/50 rounded-xl p-6 shadow-sm animate-pulse space-y-4">
                <div className="space-y-2">
                  <div className="h-5 bg-neutral-300 rounded w-1/4"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
                </div>
                <div className="w-full h-[280px] bg-neutral-50 rounded-lg flex items-end p-6 gap-2">
                  {[40, 25, 60, 45, 80, 55, 30, 70, 50, 65, 35, 90, 75, 50, 40].map((h, idx) => (
                    <div key={idx} className="bg-neutral-200 rounded-t w-full" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>

              {/* Secondary Panel: Split view for appointments list vs actions */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-pulse">
                {/* Upcoming timeline */}
                <div className="xl:col-span-8 bg-white border border-[#EAE3D9]/50 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="h-5 bg-neutral-300 rounded w-1/3"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-neutral-50 border border-[#EAE3D9]/20 rounded-lg">
                        <div className="space-y-2 w-1/2">
                          <div className="h-3.5 bg-neutral-300 rounded w-3/4"></div>
                          <div className="h-2.5 bg-neutral-200 rounded w-1/2"></div>
                          <div className="h-2 bg-neutral-200 rounded w-2/3"></div>
                        </div>
                        <div className="h-6 bg-neutral-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Administrative Quick Controls */}
                <div className="xl:col-span-4 bg-white border border-[#EAE3D9]/50 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="h-5 bg-neutral-300 rounded w-1/2"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-neutral-50 border border-[#EAE3D9]/20 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Consolidated Operations</span>
                <h3 className="font-serif-display text-3xl font-bold text-[#2C2621] mt-0.5">Performance Console</h3>
              </div>
              <div className="text-xs text-[#7C6A53] font-medium bg-white px-3.5 py-1.5 rounded-lg border border-[#EAE3D9]/40 self-start sm:self-auto shadow-sm">
                Live Server Status: <span className="font-bold text-emerald-600">Active</span>
              </div>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { 
                  label: "Today's Appointments", 
                  value: appointments.filter(a => {
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    return a.appointment_date === todayStr && a.status !== 'cancelled';
                  }).length, 
                  desc: 'Scheduled for today', 
                  color: 'from-[#F8F5F1] to-white border-indigo-200 text-indigo-700 bg-indigo-50/10',
                  icon: Clock
                },
                { 
                  label: 'Pending Requests', 
                  value: appointments.filter(a => a.status === 'pending').length, 
                  desc: 'Requires review', 
                  color: 'from-[#F8F5F1] to-white border-amber-200 text-amber-700 bg-amber-50/10',
                  icon: AlertCircle
                },
                { 
                  label: 'Upcoming Confirmed', 
                  value: appointments.filter(a => {
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    return a.status === 'confirmed' && a.appointment_date >= todayStr;
                  }).length, 
                  desc: 'Future active visits', 
                  color: 'from-[#F8F5F1] to-white border-emerald-200 text-emerald-700 bg-emerald-50/10',
                  icon: Calendar
                },
                { 
                  label: 'Completed (Last 30 Days)', 
                  value: appointments.filter(a => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA');
                    return a.status === 'completed' && a.appointment_date >= thirtyDaysAgoStr;
                  }).length, 
                  desc: 'Processed in last 30 days', 
                  color: 'from-[#F8F5F1] to-white border-[#A68A64]/30 text-[#A68A64]',
                  icon: UserCheck
                },
                { 
                  label: 'Total 30-Day Revenue', 
                  value: `$${getRevenueLast30Days().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                  desc: 'Completed in last 30 days', 
                  color: 'from-[#F8F5F1] to-white border-amber-300 text-amber-800 bg-amber-50/5',
                  icon: DollarSign
                },
                { 
                  label: 'Monthly Revenue', 
                  value: `$${getMonthlyRevenue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                  desc: `Completed in ${new Date().toLocaleString('en-US', { month: 'long' })}`, 
                  color: 'from-[#F8F5F1] to-white border-emerald-300 text-emerald-800 bg-emerald-50/5',
                  icon: DollarSign
                },
              ].map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className={`bg-gradient-to-br ${m.color} border p-5 rounded-xl shadow-sm flex items-center justify-between`}>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#7C6A53] block">{m.label}</span>
                      <p className="text-2xl font-bold font-serif-display mt-1">{m.value}</p>
                      <span className="text-[10px] text-[#7C6A53] block mt-0.5">{m.desc}</span>
                    </div>
                    <div className="p-3 bg-[#7C6A53]/5 rounded-lg text-[#A68A64] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* D3 Booking Trends Chart Section */}
            <div className="bg-white border border-[#EAE3D9]/50 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EAE3D9]/30 mb-6">
                <div>
                  <h4 className="font-serif-display text-lg font-bold text-[#2C2621]">30-Day Client Booking Trends</h4>
                  <p className="text-xs text-[#7C6A53] mt-0.5">D3.js visualization of daily active scheduled and completed bookings</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#7C6A53] bg-[#F8F5F1] border border-[#EAE3D9]/40 px-3 py-1 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A68A64] inline-block"></span>
                  Active Bookings
                </div>
              </div>
              <div className="w-full h-[280px]">
                <BookingTrendsChart appointments={appointments} />
              </div>
            </div>

            {/* Secondary Panel: Split view for appointments list vs actions */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Upcoming timeline */}
              <div className="xl:col-span-8 bg-white border border-[#EAE3D9]/50 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9]/30">
                  <h4 className="font-serif-display text-lg font-bold text-[#2C2621]">Upcoming Client Itinerary</h4>
                  <button 
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs font-bold text-[#A68A64] hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed').length === 0 ? (
                    <div className="text-center py-10 text-[#7C6A53]">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-[#A68A64]/30" />
                      <p className="text-xs font-semibold">No upcoming visits found.</p>
                      <p className="text-[10px] mt-0.5 text-[#7C6A53]">All reservations are processed or completed.</p>
                    </div>
                  ) : (
                    appointments
                      .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
                      .slice(0, 5)
                      .map(app => (
                        <div key={app.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-[#F8F5F1] border border-[#EAE3D9]/30 rounded-lg gap-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-[#2C2621] uppercase tracking-wider">{app.full_name}</p>
                            <p className="text-[11px] text-[#A68A64] font-semibold">{app.service?.name}</p>
                            <p className="text-[10px] text-[#7C6A53]">
                              {formatDateStr(app.appointment_date)} at <span className="font-semibold text-[#2C2621]">{app.start_time.substring(0, 5)}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              app.status === 'confirmed' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {app.status}
                            </span>
                            
                            <div className="flex gap-1">
                              {app.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                                  className="p-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition-all cursor-pointer"
                                  title="Approve visit"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                                className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 text-[#2C2621] transition-all cursor-pointer"
                                title="Cancel visit"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Administrative Quick Controls */}
              <div className="xl:col-span-4 bg-gradient-to-b from-white to-[#F8F5F1] border border-[#EAE3D9]/50 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-serif-display text-lg font-bold text-[#2C2621] pb-3 border-b border-[#EAE3D9]/30 mb-4">
                    Quick Operations
                  </h4>
                  <div className="space-y-3.5">
                    <button
                      onClick={() => setServiceModal({ isOpen: true, mode: 'add', service: { name: '', description: '', duration_minutes: 60, price: 90, is_active: true } })}
                      className="w-full inline-flex items-center justify-between p-3 rounded-lg border border-[#EAE3D9] bg-white hover:border-[#A68A64] transition-all text-xs font-bold uppercase tracking-wider text-[#2C2621] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#A68A64]" /> Insert Custom Ritual
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#7C6A53]" />
                    </button>

                    <button
                      onClick={handleInsertSampleAppointment}
                      className="w-full inline-flex items-center justify-between p-3 rounded-lg border border-[#EAE3D9] bg-[#F8F5F1] hover:bg-[#EAE3D9] transition-all text-xs font-bold uppercase tracking-wider text-[#2C2621] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#A68A64]" /> Seed Test Appointment
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#7C6A53]" />
                    </button>

                    <button
                      onClick={() => setBlockDateModal({ isOpen: true, dateStr: '', reason: '' })}
                      className="w-full inline-flex items-center justify-between p-3 rounded-lg border border-[#EAE3D9] bg-white hover:border-[#A68A64] transition-all text-xs font-bold uppercase tracking-wider text-[#2C2621] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarOff className="w-4 h-4 text-red-500" /> Mark Rest Day / Block Date
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#7C6A53]" />
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className="w-full inline-flex items-center justify-between p-3 rounded-lg border border-[#EAE3D9] bg-white hover:border-[#A68A64] transition-all text-xs font-bold uppercase tracking-wider text-[#2C2621] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#7C6A53]" /> Edit Booking Bounds
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#7C6A53]" />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#EAE3D9]/40 mt-6 text-center text-[10px] text-[#7C6A53]">
                  AURA Management Engine v2.4 • Connected Securely
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* Tab 2: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Client Logs</span>
              <h3 className="font-serif-display text-3xl font-bold text-[#2C2621] mt-0.5">Appointment Reservations</h3>
            </div>

            {loading ? (
              <>
                {/* Search & Filter Toolbar Skeleton */}
                <div className="bg-white border border-[#EAE3D9]/50 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 justify-between animate-pulse">
                  <div className="h-10 bg-neutral-100 border border-neutral-200 rounded-lg w-full max-w-md"></div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="h-10 bg-neutral-100 border border-neutral-200 rounded-lg w-32"></div>
                    <div className="h-10 bg-neutral-100 border border-neutral-200 rounded-lg w-32"></div>
                  </div>
                </div>

                {/* List Table Skeleton */}
                <div className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="bg-[#F8F5F1] border-b border-[#EAE3D9]/50 px-6 py-4 flex justify-between">
                    <div className="h-4 bg-neutral-300 rounded w-28"></div>
                    <div className="h-4 bg-neutral-300 rounded w-24"></div>
                  </div>
                  <div className="divide-y divide-[#EAE3D9]/20">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 w-full sm:w-1/3">
                          <div className="h-4 bg-neutral-300 rounded w-3/4"></div>
                          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                          <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                        </div>
                        <div className="space-y-2 w-full sm:w-1/4">
                          <div className="h-3.5 bg-neutral-300 rounded w-2/3"></div>
                          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                        </div>
                        <div className="space-y-1.5 w-full sm:w-1/4">
                          <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                          <div className="h-3 bg-neutral-100 rounded w-1/3"></div>
                        </div>
                        <div className="h-7 bg-neutral-200 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Search & Filter Toolbar */}
            <div className="bg-white border border-[#EAE3D9]/50 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 justify-between">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A68A64]" />
                <input
                  type="text"
                  placeholder="Search by client, email, phone, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              {/* Filter controls */}
              <div className="flex gap-2 self-start md:self-auto items-center">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-4 py-2 pr-8 text-xs font-semibold text-[#2C2621] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Approval</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A68A64] pointer-events-none" />
                </div>

                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#2C2621] focus:outline-none cursor-pointer"
                  />
                </div>

                {(statusFilter !== 'all' || dateFilter !== '') && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setDateFilter('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[#EAE3D9] hover:bg-[#F8F5F1] text-xs font-bold uppercase text-[#7C6A53] transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8F5F1] border-b border-[#EAE3D9]/50 text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider">
                      <th className="px-6 py-4">Client Detail</th>
                      <th className="px-6 py-4">Reserved Ritual</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Styling Notes</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]/20 text-xs">
                    {getFilteredAppointments().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-[#7C6A53]">
                          <Calendar className="w-10 h-10 mx-auto mb-2 text-[#A68A64]/30" />
                          <p className="font-semibold">No appointments found matching constraints.</p>
                          <p className="text-[10px] mt-0.5">Modify your search query or check different filters.</p>
                        </td>
                      </tr>
                    ) : (
                      getFilteredAppointments().map(app => (
                        <tr key={app.id} className="hover:bg-[#F8F5F1]/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#2C2621] uppercase tracking-wider">{app.full_name}</div>
                            <div className="text-[10px] text-[#7C6A53]">{app.email}</div>
                            <div className="text-[10px] text-[#7C6A53]">{app.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-[#A68A64]">{app.service?.name || 'Unassigned service'}</span>
                            <div className="text-[10px] text-[#7C6A53]">{app.service?.duration_minutes} Mins • ₹{app.service?.price}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-[#2C2621]">{formatDateStr(app.appointment_date)}</div>
                            <div className="text-[10px] text-[#7C6A53] font-mono">{app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                              app.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : app.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : app.status === 'cancelled'
                                    ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate" title={app.notes || ''}>
                            <span className="text-neutral-500 italic">{app.notes || 'No specific requests.'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {app.status !== 'confirmed' && app.status !== 'completed' && (
                                <button
                                  onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-semibold text-[10px] uppercase tracking-wider cursor-pointer border border-emerald-200"
                                >
                                  Approve
                                </button>
                              )}
                              {app.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateStatus(app.id, 'completed')}
                                  className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-semibold text-[10px] uppercase tracking-wider cursor-pointer border border-indigo-200"
                                >
                                  Complete
                                </button>
                              )}
                              {app.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                                  className="px-2 py-1 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all font-semibold text-[10px] uppercase tracking-wider cursor-pointer border border-neutral-200"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          )}
          </div>
        )}

        {/* Tab 3: SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Catalog Management</span>
                <h3 className="font-serif-display text-3xl font-bold text-[#2C2621] mt-0.5">Styling & Cut Rituals</h3>
              </div>
              
              <button
                onClick={() => setServiceModal({
                  isOpen: true,
                  mode: 'add',
                  service: { name: '', description: '', duration_minutes: 60, price: 95, is_active: true }
                })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white transition-all font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Service</span>
              </button>
            </div>

            {loading ? (
              <div className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="bg-[#F8F5F1] border-b border-[#EAE3D9]/50 px-6 py-4 flex justify-between">
                  <div className="h-4 bg-neutral-300 rounded w-28"></div>
                  <div className="h-4 bg-neutral-300 rounded w-24"></div>
                </div>
                <div className="divide-y divide-[#EAE3D9]/20">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-6 py-5 flex items-center justify-between gap-4">
                      <div className="space-y-2 w-1/2">
                        <div className="h-4.5 bg-neutral-300 rounded w-1/3"></div>
                        <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                      </div>
                      <div className="h-4 bg-neutral-300 rounded w-20"></div>
                      <div className="h-4.5 bg-neutral-300 rounded w-12"></div>
                      <div className="h-5 bg-neutral-200 rounded-full w-16"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-neutral-100 rounded w-12"></div>
                        <div className="h-8 bg-neutral-100 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* List Table */}
            <div className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8F5F1] border-b border-[#EAE3D9]/50 text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider">
                      <th className="px-6 py-4">Service Ritual</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]/20 text-xs">
                    {services.map(service => (
                      <tr key={service.id} className={`hover:bg-[#F8F5F1]/40 transition-colors ${!service.is_active ? 'bg-neutral-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#2C2621] text-sm">{service.name}</div>
                          <p className="text-[11px] text-[#7C6A53] leading-relaxed max-w-md mt-1 italic">
                            {service.description || 'No description provided.'}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#2C2621]">
                          {service.duration_minutes} Minutes
                        </td>
                        <td className="px-6 py-4 font-bold text-[#A68A64] text-sm">
                          ₹{service.price}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            service.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                          }`}>
                            {service.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setServiceModal({
                                isOpen: true,
                                mode: 'edit',
                                service: { ...service }
                              })}
                              className="p-1.5 rounded bg-white hover:bg-[#F8F5F1] border border-[#EAE3D9] text-[#2C2621] transition-all cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleServiceActive(service.id, service.is_active)}
                              className={`p-1.5 rounded border transition-all cursor-pointer ${
                                service.is_active
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={service.is_active ? 'Deactivate Service' : 'Activate Service'}
                            >
                              {service.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleDeleteService(service.id, service.name)}
                              className="p-1.5 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-all cursor-pointer"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          )}
          </div>
        )}

        {/* Tab: STAFF (MEET OUR ARTISTS) */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Team Management</span>
                <h3 className="font-serif-display text-3xl font-bold text-[#2C2621] mt-0.5">Meet Our Artists</h3>
              </div>
              
              <button
                onClick={() => setStaffModal({
                  isOpen: true,
                  mode: 'add',
                  staffMember: { name: '', role: 'Senior Stylist', experience: '8+ Years Experience', specialty: 'Hair Styling & Color', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', bio: 'Experienced professional stylist.', is_active: true }
                })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white transition-all font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-[#EAE3D9]/50 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-neutral-200 mx-auto"></div>
                    <div className="h-5 bg-neutral-300 rounded w-1/2 mx-auto"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/3 mx-auto"></div>
                    <div className="h-12 bg-neutral-100 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((artist) => (
                  <div key={artist.id} className="bg-white border border-[#EAE3D9]/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 border border-[#EAE3D9] shadow-sm">
                        <img 
                          src={artist.image_url} 
                          alt={artist.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-center mb-3">
                        <h4 className="font-serif-display text-lg font-bold text-[#2C2621]">{artist.name}</h4>
                        <p className="text-xs font-bold text-[#A68A64] uppercase tracking-wider mt-0.5">{artist.role}</p>
                        <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-[#F8F5F1] text-[10px] font-bold text-[#7C6A53] border border-[#EAE3D9]">
                          {artist.experience}
                        </span>
                      </div>

                      <p className="text-xs text-[#7C6A53] leading-relaxed text-center mb-4 italic">
                        "{artist.bio}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#EAE3D9]/40 space-y-3">
                      <p className="text-[11px] font-semibold text-[#2C2621] text-center">Specialty: <span className="text-[#A68A64]">{artist.specialty}</span></p>

                      <div className="flex items-center justify-between pt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          artist.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {artist.is_active ? 'Active on Site' : 'Hidden'}
                        </span>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setStaffModal({ isOpen: true, mode: 'edit', staffMember: { ...artist } })}
                            className="p-1.5 rounded bg-white hover:bg-[#F8F5F1] border border-[#EAE3D9] text-[#2C2621] transition-all cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStaffActive(artist.id, artist.is_active)}
                            className={`p-1.5 rounded border transition-all cursor-pointer ${
                              artist.is_active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                            title={artist.is_active ? 'Hide from site' : 'Show on site'}
                          >
                            {artist.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(artist.id, artist.name)}
                            className="p-1.5 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-all cursor-pointer"
                            title="Remove Artist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: BUSINESS HOURS */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Stylist Schedules</span>
              <h3 className="font-serif-display text-3xl font-bold text-[#2C2621] mt-0.5">Salon Business Hours</h3>
              <p className="text-xs text-[#7C6A53] mt-1 leading-relaxed">
                Toggling these schedules directly affects live reservation availability on the calendar page. Time inputs must follow 24H formatting.
              </p>
            </div>

            {loading ? (
              <div className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm overflow-hidden divide-y divide-[#EAE3D9]/20 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="w-9 h-5 bg-neutral-200 rounded-full"></div>
                      <div className="space-y-1.5 w-full">
                        <div className="h-4 bg-neutral-300 rounded w-1/2"></div>
                        <div className="h-2.5 bg-neutral-200 rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-9 bg-neutral-100 rounded w-24"></div>
                      <div className="h-4 bg-neutral-200 rounded w-4"></div>
                      <div className="h-9 bg-neutral-100 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-[#EAE3D9]/20">
                {businessHours.map(hour => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={hour.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white hover:bg-[#F8F5F1]/30 transition-all">
                      {/* Weekday Info */}
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hour.is_open}
                            onChange={(e) => handleHourToggle(hour.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A68A64]"></div>
                        </label>
                        <div>
                          <span className="text-sm font-bold text-[#2C2621] uppercase tracking-wider">{dayNames[hour.weekday]}</span>
                          <span className={`text-[10px] block font-semibold uppercase tracking-wider ${hour.is_open ? 'text-emerald-600' : 'text-neutral-400'}`}>
                            {hour.is_open ? 'Open for bookings' : 'Closed'}
                          </span>
                        </div>
                      </div>

                      {/* Hour Pickers */}
                      {hour.is_open ? (
                        <div className="flex items-center gap-2.5">
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest text-[#7C6A53] font-bold mb-1">Opens</span>
                            <input
                              type="time"
                              required
                              value={hour.start_time.substring(0, 5)}
                              onChange={(e) => handleHourTimeChange(hour.id, 'start', e.target.value)}
                              className="bg-[#F8F5F1] border border-[#EAE3D9] rounded px-2.5 py-1 text-xs font-semibold focus:outline-none text-[#2C2621]"
                            />
                          </div>
                          <span className="text-neutral-300 mt-4">—</span>
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest text-[#7C6A53] font-bold mb-1">Closes</span>
                            <input
                              type="time"
                              required
                              value={hour.end_time.substring(0, 5)}
                              onChange={(e) => handleHourTimeChange(hour.id, 'end', e.target.value)}
                              className="bg-[#F8F5F1] border border-[#EAE3D9] rounded px-2.5 py-1 text-xs font-semibold focus:outline-none text-[#2C2621]"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-400 italic">No slots will be generated on this day.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
          )}
          </div>
        )}

        {/* Tab 5: BLOCKED DATES */}
        {activeTab === 'blocked' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Reservation Safety Bounds</span>
                <h3 className="font-serif-display text-3xl font-bold text-[#2C2621] mt-0.5">Blocked Dates</h3>
              </div>

              <button
                onClick={() => setBlockDateModal({ isOpen: true, dateStr: '', reason: '' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white transition-all font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Block Specific Date</span>
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-[#EAE3D9]/50 p-5 rounded-xl shadow-sm flex items-start justify-between gap-4">
                    <div className="space-y-3 w-3/4">
                      <div className="h-5.5 bg-neutral-200 rounded w-1/2"></div>
                      <div className="h-3 bg-neutral-300 rounded w-1/4"></div>
                      <div className="h-3.5 bg-neutral-200 rounded w-full"></div>
                    </div>
                    <div className="h-8 bg-neutral-100 rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blockedDates.length === 0 ? (
                <div className="col-span-full bg-white border border-[#EAE3D9]/50 rounded-xl p-10 text-center text-[#7C6A53] shadow-sm">
                  <CalendarOff className="w-10 h-10 text-[#A68A64]/30 mx-auto mb-2" />
                  <p className="font-semibold">No dates are currently blocked.</p>
                  <p className="text-[10px] mt-0.5">The salon operates on standard weekday schedules defined in Business Hours.</p>
                </div>
              ) : (
                blockedDates.map(item => (
                  <div key={item.id} className="bg-white border border-red-100 p-4 rounded-xl shadow-sm flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {formatDateStr(item.blocked_date)}
                      </span>
                      <p className="text-xs font-semibold text-[#2C2621] mt-2">Reason</p>
                      <p className="text-xs text-[#7C6A53] italic leading-relaxed">
                        "{item.reason || 'Rest day, holiday or private stylist training event.'}"
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveBlockedDate(item.id, formatDateStr(item.blocked_date))}
                      className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100"
                      title="Unblock date"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
          )}
          </div>
        )}

        {/* Tab 6: SALON SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Identity & Rule Bounds</span>
              <h3 className="font-serif-display text-3xl font-bold text-[#2C2621] mt-0.5">Salon Configuration</h3>
            </div>

            {loading ? (
              <div className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-neutral-300 rounded w-1/3"></div>
                      <div className="h-10 bg-neutral-100 border border-neutral-200 rounded-lg w-full"></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-neutral-300 rounded w-1/6"></div>
                  <div className="h-20 bg-neutral-100 border border-neutral-200 rounded-lg w-full"></div>
                </div>
                <div className="pt-4 border-t border-[#EAE3D9]/30 flex justify-end">
                  <div className="h-10 bg-neutral-300 rounded-full w-36"></div>
                </div>
              </div>
            ) : (
              <>
                {settings && (
              <form onSubmit={handleSaveSettings} className="bg-white border border-[#EAE3D9]/50 rounded-xl shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1.5">
                      Salon Branding Name
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.salon_name}
                      onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
                      className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621] font-bold uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1.5">
                      Support Email
                    </label>
                    <input
                      type="email"
                      required
                      value={settings.salon_email}
                      onChange={(e) => setSettings({ ...settings, salon_email: e.target.value })}
                      className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1.5">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.salon_phone}
                      onChange={(e) => setSettings({ ...settings, salon_phone: e.target.value })}
                      className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1.5">
                      Booking Interval (Minutes)
                    </label>
                    <select
                      value={settings.slot_interval_minutes}
                      onChange={(e) => setSettings({ ...settings, slot_interval_minutes: Number(e.target.value) })}
                      className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621] font-medium"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1.5">
                      Min Notice Period (Hours)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settings.booking_notice_hours}
                      onChange={(e) => setSettings({ ...settings, booking_notice_hours: Number(e.target.value) })}
                      className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1.5">
                    Salon Physical Address
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={settings.salon_address}
                    onChange={(e) => setSettings({ ...settings, salon_address: e.target.value })}
                    className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                  />
                </div>

                <div className="border-t border-[#EAE3D9]/30 pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4 text-[#A68A64]" />
                    <span>Save Configuration</span>
                  </button>
                </div>
              </form>
            )}
          </>
          )}
          </div>
        )}
      </main>

      {/* MODAL / DRAWER - SERVICE CREATE & UPDATE */}
      {serviceModal.isOpen && serviceModal.service && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2621]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#EAE3D9] overflow-hidden">
            {/* Header */}
            <div className="bg-[#7C6A53] text-white p-5 flex items-center justify-between border-b border-[#EAE3D9]/20">
              <h4 className="font-serif-display text-lg font-bold">
                {serviceModal.mode === 'add' ? 'Insert Bespoke Ritual' : 'Modify Salon Ritual'}
              </h4>
              <button
                onClick={() => setServiceModal({ isOpen: false, mode: 'add', service: null })}
                className="p-1 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={serviceModal.service.name || ''}
                  onChange={(e) => setServiceModal(prev => ({
                    ...prev,
                    service: { ...prev.service!, name: e.target.value }
                  }))}
                  placeholder="e.g. Signature Silk Blowout"
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={serviceModal.service.duration_minutes || ''}
                    onChange={(e) => setServiceModal(prev => ({
                      ...prev,
                      service: { ...prev.service!, duration_minutes: Number(e.target.value) }
                    }))}
                    className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                    Pricing Rate ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={serviceModal.service.price || ''}
                    onChange={(e) => setServiceModal(prev => ({
                      ...prev,
                      service: { ...prev.service!, price: Number(e.target.value) }
                    }))}
                    className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Ritual Description
                </label>
                <textarea
                  rows={3}
                  value={serviceModal.service.description || ''}
                  onChange={(e) => setServiceModal(prev => ({
                    ...prev,
                    service: { ...prev.service!, description: e.target.value }
                  }))}
                  placeholder="Describe the styling consultation, nourishment washing, specific premium oils, blowdrying options..."
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="srv-active"
                  type="checkbox"
                  checked={serviceModal.service.is_active ?? true}
                  onChange={(e) => setServiceModal(prev => ({
                    ...prev,
                    service: { ...prev.service!, is_active: e.target.checked }
                  }))}
                  className="rounded border-[#EAE3D9] text-[#A68A64] focus:ring-[#A68A64]/30 cursor-pointer"
                />
                <label htmlFor="srv-active" className="text-xs font-semibold text-[#2C2621] uppercase tracking-wider cursor-pointer">
                  Service is available for public online bookings
                </label>
              </div>

              <div className="border-t border-[#EAE3D9]/30 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setServiceModal({ isOpen: false, mode: 'add', service: null })}
                  className="px-4 py-2 rounded-full border border-[#EAE3D9] text-[#2C2621] hover:bg-[#EAE3D9] transition-all font-semibold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#A68A64]" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - BLOCK DATE */}
      {blockDateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2621]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#EAE3D9] overflow-hidden">
            {/* Header */}
            <div className="bg-[#7C6A53] text-white p-5 flex items-center justify-between border-b border-[#EAE3D9]/20">
              <h4 className="font-serif-display text-lg font-bold">Restrict Booking Date</h4>
              <button
                onClick={() => setBlockDateModal({ isOpen: false, dateStr: '', reason: '' })}
                className="p-1 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddBlockedDateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Restrict Date
                </label>
                <input
                  type="date"
                  required
                  value={blockDateModal.dateStr}
                  onChange={(e) => setBlockDateModal(prev => ({ ...prev, dateStr: e.target.value }))}
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Reason for restriction
                </label>
                <input
                  type="text"
                  required
                  value={blockDateModal.reason}
                  onChange={(e) => setBlockDateModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Labor Day Holiday / Salon Renovation"
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div className="border-t border-[#EAE3D9]/30 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBlockDateModal({ isOpen: false, dateStr: '', reason: '' })}
                  className="px-4 py-2 rounded-full border border-[#EAE3D9] text-[#2C2621] hover:bg-[#EAE3D9] transition-all font-semibold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#A68A64]" />
                  <span>Restrict Date</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER - STAFF CREATE & UPDATE */}
      {staffModal.isOpen && staffModal.staffMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2621]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#EAE3D9] overflow-hidden">
            <div className="bg-[#7C6A53] text-white p-5 flex items-center justify-between border-b border-[#EAE3D9]/20">
              <h4 className="font-serif-display text-lg font-bold">
                {staffModal.mode === 'add' ? 'Add Salon Artist' : 'Edit Artist Profile'}
              </h4>
              <button
                onClick={() => setStaffModal({ isOpen: false, mode: 'add', staffMember: null })}
                className="p-1 rounded-lg text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Artist Full Name
                </label>
                <input
                  type="text"
                  required
                  value={staffModal.staffMember.name || ''}
                  onChange={(e) => setStaffModal(prev => ({
                    ...prev,
                    staffMember: { ...prev.staffMember!, name: e.target.value }
                  }))}
                  placeholder="e.g. Vikram Singh"
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={staffModal.staffMember.role || ''}
                    onChange={(e) => setStaffModal(prev => ({
                      ...prev,
                      staffMember: { ...prev.staffMember!, role: e.target.value }
                    }))}
                    placeholder="e.g. Senior Stylist & Colorist"
                    className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                    Experience Badge
                  </label>
                  <input
                    type="text"
                    required
                    value={staffModal.staffMember.experience || ''}
                    onChange={(e) => setStaffModal(prev => ({
                      ...prev,
                      staffMember: { ...prev.staffMember!, experience: e.target.value }
                    }))}
                    placeholder="e.g. 10+ Years Experience"
                    className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  required
                  value={staffModal.staffMember.specialty || ''}
                  onChange={(e) => setStaffModal(prev => ({
                    ...prev,
                    staffMember: { ...prev.staffMember!, specialty: e.target.value }
                  }))}
                  placeholder="e.g. Precision Cuts & Balayage"
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Portrait Image URL (Unsplash / Photo Link)
                </label>
                <input
                  type="url"
                  required
                  value={staffModal.staffMember.image_url || ''}
                  onChange={(e) => setStaffModal(prev => ({
                    ...prev,
                    staffMember: { ...prev.staffMember!, image_url: e.target.value }
                  }))}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                  Biography / Expertise Intro
                </label>
                <textarea
                  rows={2}
                  value={staffModal.staffMember.bio || ''}
                  onChange={(e) => setStaffModal(prev => ({
                    ...prev,
                    staffMember: { ...prev.staffMember!, bio: e.target.value }
                  }))}
                  placeholder="Renowned across Jaipur for bespoke precision haircuts..."
                  className="w-full bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#A68A64] text-[#2C2621]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffModal.staffMember.is_active ?? true}
                    onChange={(e) => setStaffModal(prev => ({
                      ...prev,
                      staffMember: { ...prev.staffMember!, is_active: e.target.checked }
                    }))}
                    className="rounded border-[#EAE3D9] text-[#7C6A53] focus:ring-[#A68A64]"
                  />
                  <span className="text-xs font-semibold text-[#2C2621]">Display on Public Homepage</span>
                </label>
              </div>

              <div className="border-t border-[#EAE3D9]/30 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStaffModal({ isOpen: false, mode: 'add', staffMember: null })}
                  className="px-4 py-2 rounded-lg border border-[#EAE3D9] text-[#7C6A53] font-bold text-xs uppercase tracking-wider hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#7C6A53] hover:bg-[#5A4D3F] text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Save Artist Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
