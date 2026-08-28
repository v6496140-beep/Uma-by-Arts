import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getAppointments, updateAppointmentStatus } from '../lib/dbService';
import { Appointment } from '../types';
import { User, Calendar, Mail, Clock, CheckCircle2, XCircle, AlertCircle, LogOut, Scissors, ArrowRight } from 'lucide-react';

interface UserDashboardProps {
  session: any;
  onLogout: () => void;
  onNavigateHome: () => void;
  onBookNow: () => void;
  onRedirectLogin: () => void;
}

export default function UserDashboard({ session, onLogout, onNavigateHome, onBookNow, onRedirectLogin }: UserDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    // Verify session on load
    async function verifyAndLoad() {
      const currentSession = session || (await supabase.auth.getSession()).data.session;
      if (!currentSession || !currentSession.user) {
        onRedirectLogin();
        return;
      }

      const user = currentSession.user;
      const email = user.email || '';
      const userId = user.id;

      try {
        const allAppts = await getAppointments();
        // Filter appointments belonging to this user securely by auth user id or matching email
        const userAppts = allAppts.filter(
          (app: any) => 
            (app.user_id && app.user_id === userId) || 
            (app.email && app.email.toLowerCase() === email.toLowerCase())
        );
        setAppointments(userAppts);
      } catch (err) {
        console.error('Error loading user appointments:', err);
      } finally {
        setLoading(false);
      }
    }

    verifyAndLoad();
  }, [session, onRedirectLogin]);

  const user = session?.user;
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Client';
  const email = user?.email || '';

  const loadUserAppointments = async () => {
    try {
      const allAppts = await getAppointments();
      const userAppts = allAppts.filter(
        (app: any) => 
          (app.user_id && app.user_id === user?.id) || 
          (app.email && app.email.toLowerCase() === email.toLowerCase())
      );
      setAppointments(userAppts);
    } catch (err) {
      console.error('Error loading user appointments:', err);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await updateAppointmentStatus(id, 'cancelled');
      await loadUserAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F1] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Navbar / Header */}
        <div className="bg-white border border-[#EAE3D9]/60 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#F8F5F1] border border-[#EAE3D9] flex items-center justify-center text-[#7C6A53] font-serif-display text-2xl font-bold shadow-inner">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#A68A64] font-bold">Client Portal</span>
              <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#2C2621] mt-0.5">{fullName}</h1>
              <p className="text-xs text-[#7C6A53] flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onNavigateHome}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-[#EAE3D9] text-xs font-semibold text-[#7C6A53] hover:bg-[#F8F5F1] transition-all cursor-pointer"
            >
              Back to Website
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display text-xl font-bold text-[#2C2621]">Your Reservations</h2>
              <p className="text-xs text-[#7C6A53]">Manage your scheduled and past appointments at AURA</p>
            </div>
            <button
              onClick={onBookNow}
              className="px-4 py-2 rounded-xl bg-[#7C6A53] hover:bg-[#5A4D3F] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Book New Ritual</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white border border-[#EAE3D9]/50 rounded-2xl p-12 text-center animate-pulse space-y-4">
              <div className="h-4 bg-neutral-200 rounded w-1/4 mx-auto"></div>
              <div className="h-8 bg-neutral-100 rounded w-1/2 mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white border border-[#EAE3D9]/60 rounded-2xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#F8F5F1] border border-[#EAE3D9] flex items-center justify-center mx-auto text-[#A68A64]">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif-display text-lg font-bold text-[#2C2621]">No Appointments Yet</h3>
                <p className="text-xs text-[#7C6A53] max-w-sm mx-auto">
                  You haven't scheduled any luxury treatments yet. Explore our signature rituals and book your visit today.
                </p>
              </div>
              <button
                onClick={onBookNow}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C6A53] hover:bg-[#5A4D3F] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Book Appointment Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((app) => {
                const serviceName = app.service?.name || 'Hair Ritual';
                const isPending = app.status === 'pending';
                const isConfirmed = app.status === 'confirmed';
                const isCancelled = app.status === 'cancelled';

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-[#EAE3D9]/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#A68A64]">
                        Ref: {app.id.slice(0, 8)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {isConfirmed && <CheckCircle2 className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        {isCancelled && <XCircle className="w-3 h-3" />}
                        <span>{app.status}</span>
                      </span>
                    </div>

                    {/* Service & Date Info */}
                    <div className="space-y-2">
                      <h4 className="font-serif-display text-lg font-bold text-[#2C2621]">{serviceName}</h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#7C6A53] pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#A68A64]" />
                          <span>{app.appointment_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#A68A64]" />
                          <span>{app.start_time} - {app.end_time}</span>
                        </div>
                      </div>

                      {app.notes && (
                        <p className="text-xs text-neutral-500 italic bg-[#F8F5F1] p-2.5 rounded-xl border border-[#EAE3D9]/40 mt-2">
                          "{app.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-[#EAE3D9]/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2C2621]">
                        ₹{app.service?.price || 0}
                      </span>

                      {(isPending || isConfirmed) && (
                        <button
                          disabled={cancellingId === app.id}
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {cancellingId === app.id ? 'Cancelling...' : 'Cancel Reservation'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
