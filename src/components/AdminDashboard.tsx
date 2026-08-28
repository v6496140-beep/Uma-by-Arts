import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  getAppointments, 
  getServices, 
  getBusinessHours, 
  getBlockedDates, 
  getSalonSettings,
  updateAppointmentStatus,
  createService,
  updateService,
  updateBusinessHours,
  addBlockedDate,
  removeBlockedDate,
  updateSalonSettings,
  areSupabaseTablesMissing
} from '../lib/dbService';
import { Service, Appointment, BusinessHours, BlockedDate, SalonSettings } from '../types';
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

type TabType = 'overview' | 'appointments' | 'services' | 'hours' | 'blocked' | 'settings';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [salonName, setSalonName] = useState('AURA Hair Salon');

  // Core DB States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<SalonSettings | null>(null);

  // Load States & UI feedbacks
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter state for appointments page
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals / Drawer States
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    service: Partial<Service> | null;
  }>({ isOpen: false, mode: 'add', service: null });

  const [blockDateModal, setBlockDateModal] = useState({
    isOpen: false,
    dateStr: '',
    reason: ''
  });

  // Load all dashboard records from Supabase
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [allApps, allServs, hours, blocks, salonConf] = await Promise.all([
        getAppointments(),
        getServices(),
        getBusinessHours(),
        getBlockedDates(),
        getSalonSettings()
      ]);

      setAppointments(allApps);
      setServices(allServs);
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
      
      return matchesSearch && matchesStatus;
    });
  };

  // Helper date formatter
  const formatDateStr = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[#8B7E74]">Synchronizing administrative registers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-[#FAF8F5] flex flex-col lg:flex-row border border-[#EADCC9]/50 rounded-2xl shadow-xl overflow-hidden relative">
      
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
      <aside className="w-full lg:w-64 bg-[#3E3C3A] text-white shrink-0 flex flex-col justify-between border-r border-[#EADCC9]/10">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-[#EADCC9]/10">
            <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">Admin Workspace</span>
            <h3 className="font-serif-display text-xl font-bold tracking-wide mt-1 line-clamp-1 text-white">
              {salonName}
            </h3>
            {areSupabaseTablesMissing() && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FAF8F5]/10 text-[#C5A880]">
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
                      ? 'bg-[#C5A880] text-[#3E3C3A] font-bold shadow-md'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
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
        <div className="p-4 border-t border-[#EADCC9]/10">
          <div className="flex items-center gap-3 p-2 bg-[#FAF8F5]/5 rounded-lg mb-3">
            <div className="w-8 h-8 rounded-full bg-[#C5A880] text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
              M
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Manager</p>
              <p className="text-[10px] text-[#EADCC9]/60 truncate max-w-[130px]">concierge@aurasalon.com</p>
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">Consolidated Operations</span>
                <h3 className="font-serif-display text-3xl font-bold text-[#3E3C3A] mt-0.5">Performance Console</h3>
              </div>
              <div className="text-xs text-[#8B7E74] font-medium bg-white px-3.5 py-1.5 rounded-lg border border-[#EADCC9]/40 self-start sm:self-auto shadow-sm">
                Live Server Status: <span className="font-bold text-emerald-600">Active</span>
              </div>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  label: 'Total Booked', 
                  value: appointments.length, 
                  desc: 'All booking entries', 
                  color: 'from-[#FAF8F5] to-white border-[#EADCC9]/50 text-[#1F1E1D]',
                  icon: Users
                },
                { 
                  label: 'Pending Approval', 
                  value: appointments.filter(a => a.status === 'pending').length, 
                  desc: 'Requires review', 
                  color: 'from-[#FAF8F5] to-white border-amber-200 text-amber-700 bg-amber-50/10',
                  icon: AlertCircle
                },
                { 
                  label: 'Confirmed Visits', 
                  value: appointments.filter(a => a.status === 'confirmed').length, 
                  desc: 'Scheduled sessions', 
                  color: 'from-[#FAF8F5] to-white border-emerald-200 text-emerald-700 bg-emerald-50/10',
                  icon: Calendar
                },
                { 
                  label: 'Bespoke Services', 
                  value: services.filter(s => s.is_active).length, 
                  desc: 'Active salon rituals', 
                  color: 'from-[#FAF8F5] to-white border-[#C5A880]/30 text-[#C5A880]',
                  icon: Scissors
                },
              ].map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className={`bg-gradient-to-br ${m.color} border p-5 rounded-xl shadow-sm flex items-center justify-between`}>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#8B7E74] block">{m.label}</span>
                      <p className="text-3xl font-bold font-serif-display mt-1">{m.value}</p>
                      <span className="text-[10px] text-[#8B7E74] block mt-0.5">{m.desc}</span>
                    </div>
                    <div className="p-3 bg-[#3E3C3A]/5 rounded-lg text-[#C5A880] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Secondary Panel: Split view for appointments list vs actions */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Upcoming timeline */}
              <div className="xl:col-span-8 bg-white border border-[#EADCC9]/50 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EADCC9]/30">
                  <h4 className="font-serif-display text-lg font-bold text-[#3E3C3A]">Upcoming Client Itinerary</h4>
                  <button 
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs font-bold text-[#C5A880] hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed').length === 0 ? (
                    <div className="text-center py-10 text-[#8B7E74]">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-[#C5A880]/30" />
                      <p className="text-xs font-semibold">No upcoming visits found.</p>
                      <p className="text-[10px] mt-0.5 text-[#8B7E74]">All reservations are processed or completed.</p>
                    </div>
                  ) : (
                    appointments
                      .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
                      .slice(0, 5)
                      .map(app => (
                        <div key={app.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-[#FAF8F5] border border-[#EADCC9]/30 rounded-lg gap-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-[#1F1E1D] uppercase tracking-wider">{app.full_name}</p>
                            <p className="text-[11px] text-[#C5A880] font-semibold">{app.service?.name}</p>
                            <p className="text-[10px] text-[#8B7E74]">
                              {formatDateStr(app.appointment_date)} at <span className="font-semibold text-[#3E3C3A]">{app.start_time.substring(0, 5)}</span>
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
                                className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 text-[#3E3C3A] transition-all cursor-pointer"
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
              <div className="xl:col-span-4 bg-gradient-to-b from-white to-[#FAF8F5] border border-[#EADCC9]/50 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-serif-display text-lg font-bold text-[#3E3C3A] pb-3 border-b border-[#EADCC9]/30 mb-4">
                    Quick Operations
                  </h4>
                  <div className="space-y-3.5">
                    <button
                      onClick={() => setServiceModal({ isOpen: true, mode: 'add', service: { name: '', description: '', duration_minutes: 60, price: 90, is_active: true } })}
                      className="w-full inline-flex items-center justify-between p-3 rounded-lg border border-[#EADCC9] bg-white hover:border-[#C5A880] transition-all text-xs font-bold uppercase tracking-wider text-[#3E3C3A] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#C5A880]" /> Insert Custom Ritual
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8B7E74]" />
                    </button>

                    <button
                      onClick={() => setBlockDateModal({ isOpen: true, dateStr: '', reason: '' })}
                      className="w-full inline-flex items-center justify-between p-3 rounded-lg border border-[#EADCC9] bg-white hover:border-[#C5A880] transition-all text-xs font-bold uppercase tracking-wider text-[#3E3C3A] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarOff className="w-4 h-4 text-red-500" /> Mark Rest Day / Block Date
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8B7E74]" />
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className="w-full inline-flex items-center justify-between p-3 rounded-lg border border-[#EADCC9] bg-white hover:border-[#C5A880] transition-all text-xs font-bold uppercase tracking-wider text-[#3E3C3A] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#8B7E74]" /> Edit Booking Bounds
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8B7E74]" />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#EADCC9]/40 mt-6 text-center text-[10px] text-[#8B7E74]">
                  AURA Management Engine v2.4 • Connected Securely
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">Client Logs</span>
              <h3 className="font-serif-display text-3xl font-bold text-[#3E3C3A] mt-0.5">Appointment Reservations</h3>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white border border-[#EADCC9]/50 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 justify-between">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A880]" />
                <input
                  type="text"
                  placeholder="Search by client, email, phone, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                />
              </div>

              {/* Filter controls */}
              <div className="flex gap-2 self-start md:self-auto">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-4 py-2 pr-8 text-xs font-semibold text-[#3E3C3A] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Approval</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C5A880] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-[#EADCC9]/50 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#EADCC9]/50 text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">
                      <th className="px-6 py-4">Client Detail</th>
                      <th className="px-6 py-4">Reserved Ritual</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Styling Notes</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADCC9]/20 text-xs">
                    {getFilteredAppointments().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-[#8B7E74]">
                          <Calendar className="w-10 h-10 mx-auto mb-2 text-[#C5A880]/30" />
                          <p className="font-semibold">No appointments found matching constraints.</p>
                          <p className="text-[10px] mt-0.5">Modify your search query or check different filters.</p>
                        </td>
                      </tr>
                    ) : (
                      getFilteredAppointments().map(app => (
                        <tr key={app.id} className="hover:bg-[#FAF8F5]/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#1F1E1D] uppercase tracking-wider">{app.full_name}</div>
                            <div className="text-[10px] text-[#8B7E74]">{app.email}</div>
                            <div className="text-[10px] text-[#8B7E74]">{app.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-[#C5A880]">{app.service?.name || 'Unassigned service'}</span>
                            <div className="text-[10px] text-[#8B7E74]">{app.service?.duration_minutes} Mins • ${app.service?.price}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-[#3E3C3A]">{formatDateStr(app.appointment_date)}</div>
                            <div className="text-[10px] text-[#8B7E74] font-mono">{app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)}</div>
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
          </div>
        )}

        {/* Tab 3: SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">Catalog Management</span>
                <h3 className="font-serif-display text-3xl font-bold text-[#3E3C3A] mt-0.5">Styling & Cut Rituals</h3>
              </div>
              
              <button
                onClick={() => setServiceModal({
                  isOpen: true,
                  mode: 'add',
                  service: { name: '', description: '', duration_minutes: 60, price: 95, is_active: true }
                })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white transition-all font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Service</span>
              </button>
            </div>

            {/* List Table */}
            <div className="bg-white border border-[#EADCC9]/50 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#EADCC9]/50 text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider">
                      <th className="px-6 py-4">Service Ritual</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADCC9]/20 text-xs">
                    {services.map(service => (
                      <tr key={service.id} className={`hover:bg-[#FAF8F5]/40 transition-colors ${!service.is_active ? 'bg-neutral-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#3E3C3A] text-sm">{service.name}</div>
                          <p className="text-[11px] text-[#8B7E74] leading-relaxed max-w-md mt-1 italic">
                            {service.description || 'No description provided.'}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#1F1E1D]">
                          {service.duration_minutes} Minutes
                        </td>
                        <td className="px-6 py-4 font-bold text-[#C5A880] text-sm">
                          ${service.price}
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
                              className="p-1.5 rounded bg-white hover:bg-[#FAF8F5] border border-[#EADCC9] text-[#3E3C3A] transition-all cursor-pointer"
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: BUSINESS HOURS */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">Stylist Schedules</span>
              <h3 className="font-serif-display text-3xl font-bold text-[#3E3C3A] mt-0.5">Salon Business Hours</h3>
              <p className="text-xs text-[#8B7E74] mt-1 leading-relaxed">
                Toggling these schedules directly affects live reservation availability on the calendar page. Time inputs must follow 24H formatting.
              </p>
            </div>

            <div className="bg-white border border-[#EADCC9]/50 rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-[#EADCC9]/20">
                {businessHours.map(hour => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={hour.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white hover:bg-[#FAF8F5]/30 transition-all">
                      {/* Weekday Info */}
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hour.is_open}
                            onChange={(e) => handleHourToggle(hour.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C5A880]"></div>
                        </label>
                        <div>
                          <span className="text-sm font-bold text-[#3E3C3A] uppercase tracking-wider">{dayNames[hour.weekday]}</span>
                          <span className={`text-[10px] block font-semibold uppercase tracking-wider ${hour.is_open ? 'text-emerald-600' : 'text-neutral-400'}`}>
                            {hour.is_open ? 'Open for bookings' : 'Closed'}
                          </span>
                        </div>
                      </div>

                      {/* Hour Pickers */}
                      {hour.is_open ? (
                        <div className="flex items-center gap-2.5">
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest text-[#8B7E74] font-bold mb-1">Opens</span>
                            <input
                              type="time"
                              required
                              value={hour.start_time.substring(0, 5)}
                              onChange={(e) => handleHourTimeChange(hour.id, 'start', e.target.value)}
                              className="bg-[#FAF8F5] border border-[#EADCC9] rounded px-2.5 py-1 text-xs font-semibold focus:outline-none text-[#1F1E1D]"
                            />
                          </div>
                          <span className="text-neutral-300 mt-4">—</span>
                          <div>
                            <span className="block text-[9px] uppercase tracking-widest text-[#8B7E74] font-bold mb-1">Closes</span>
                            <input
                              type="time"
                              required
                              value={hour.end_time.substring(0, 5)}
                              onChange={(e) => handleHourTimeChange(hour.id, 'end', e.target.value)}
                              className="bg-[#FAF8F5] border border-[#EADCC9] rounded px-2.5 py-1 text-xs font-semibold focus:outline-none text-[#1F1E1D]"
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
          </div>
        )}

        {/* Tab 5: BLOCKED DATES */}
        {activeTab === 'blocked' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">Reservation Safety Bounds</span>
                <h3 className="font-serif-display text-3xl font-bold text-[#3E3C3A] mt-0.5">Blocked Dates</h3>
              </div>

              <button
                onClick={() => setBlockDateModal({ isOpen: true, dateStr: '', reason: '' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white transition-all font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Block Specific Date</span>
              </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blockedDates.length === 0 ? (
                <div className="col-span-full bg-white border border-[#EADCC9]/50 rounded-xl p-10 text-center text-[#8B7E74] shadow-sm">
                  <CalendarOff className="w-10 h-10 text-[#C5A880]/30 mx-auto mb-2" />
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
                      <p className="text-xs font-semibold text-[#3E3C3A] mt-2">Reason</p>
                      <p className="text-xs text-[#8B7E74] italic leading-relaxed">
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
          </div>
        )}

        {/* Tab 6: SALON SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">Identity & Rule Bounds</span>
              <h3 className="font-serif-display text-3xl font-bold text-[#3E3C3A] mt-0.5">Salon Configuration</h3>
            </div>

            {settings && (
              <form onSubmit={handleSaveSettings} className="bg-white border border-[#EADCC9]/50 rounded-xl shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5">
                      Salon Branding Name
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.salon_name}
                      onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D] font-bold uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5">
                      Support Email
                    </label>
                    <input
                      type="email"
                      required
                      value={settings.salon_email}
                      onChange={(e) => setSettings({ ...settings, salon_email: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.salon_phone}
                      onChange={(e) => setSettings({ ...settings, salon_phone: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5">
                      Booking Interval (Minutes)
                    </label>
                    <select
                      value={settings.slot_interval_minutes}
                      onChange={(e) => setSettings({ ...settings, slot_interval_minutes: Number(e.target.value) })}
                      className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D] font-medium"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5">
                      Min Notice Period (Hours)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settings.booking_notice_hours}
                      onChange={(e) => setSettings({ ...settings, booking_notice_hours: Number(e.target.value) })}
                      className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5">
                    Salon Physical Address
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={settings.salon_address}
                    onChange={(e) => setSettings({ ...settings, salon_address: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                  />
                </div>

                <div className="border-t border-[#EADCC9]/30 pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4 text-[#C5A880]" />
                    <span>Save Configuration</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* MODAL / DRAWER - SERVICE CREATE & UPDATE */}
      {serviceModal.isOpen && serviceModal.service && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#EADCC9] overflow-hidden">
            {/* Header */}
            <div className="bg-[#3E3C3A] text-white p-5 flex items-center justify-between border-b border-[#EADCC9]/20">
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
                <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
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
                  className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
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
                    className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
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
                    className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
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
                  className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
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
                  className="rounded border-[#EADCC9] text-[#C5A880] focus:ring-[#C5A880]/30 cursor-pointer"
                />
                <label htmlFor="srv-active" className="text-xs font-semibold text-[#3E3C3A] uppercase tracking-wider cursor-pointer">
                  Service is available for public online bookings
                </label>
              </div>

              <div className="border-t border-[#EADCC9]/30 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setServiceModal({ isOpen: false, mode: 'add', service: null })}
                  className="px-4 py-2 rounded-full border border-[#EADCC9] text-[#3E3C3A] hover:bg-[#F4EFE6] transition-all font-semibold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#C5A880]" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - BLOCK DATE */}
      {blockDateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#EADCC9] overflow-hidden">
            {/* Header */}
            <div className="bg-[#3E3C3A] text-white p-5 flex items-center justify-between border-b border-[#EADCC9]/20">
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
                <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
                  Restrict Date
                </label>
                <input
                  type="date"
                  required
                  value={blockDateModal.dateStr}
                  onChange={(e) => setBlockDateModal(prev => ({ ...prev, dateStr: e.target.value }))}
                  className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1">
                  Reason for restriction
                </label>
                <input
                  type="text"
                  required
                  value={blockDateModal.reason}
                  onChange={(e) => setBlockDateModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Labor Day Holiday / Salon Renovation"
                  className="w-full bg-[#FAF8F5] border border-[#EADCC9] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C5A880] text-[#1F1E1D]"
                />
              </div>

              <div className="border-t border-[#EADCC9]/30 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBlockDateModal({ isOpen: false, dateStr: '', reason: '' })}
                  className="px-4 py-2 rounded-full border border-[#EADCC9] text-[#3E3C3A] hover:bg-[#F4EFE6] transition-all font-semibold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#C5A880]" />
                  <span>Restrict Date</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
