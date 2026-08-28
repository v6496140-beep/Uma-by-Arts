import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (view: 'public' | 'login') => void;
}

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}`,
      });

      if (error) throw error;

      setSuccessMsg('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Could not send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#EAE3D9]/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#F8F5F1] px-6 py-8 text-center border-b border-[#EAE3D9]/40 relative">
          <button
            onClick={() => onNavigate('login')}
            className="absolute top-4 left-4 text-xs font-semibold text-[#7C6A53] hover:text-[#2C2621] transition-colors"
          >
            ← Back to Sign In
          </button>
          
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#EAE3D9] shadow-sm mb-3">
            <Sparkles className="w-5 h-5 text-[#A68A64]" />
          </div>
          <h2 className="font-serif-display text-2xl font-bold text-[#2C2621]">Reset Password</h2>
          <p className="text-xs text-[#7C6A53] mt-1">Enter your account email to receive reset instructions</p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE3D9] bg-[#F8F5F1]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]/50 focus:bg-white text-[#2C2621]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#7C6A53] hover:bg-[#5A4D3F] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Sending Instructions...</span>
              ) : (
                <>
                  <span>Send Reset Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-[#EAE3D9]/40">
            <button
              onClick={() => onNavigate('login')}
              className="text-xs font-semibold text-[#A68A64] hover:underline"
            >
              Remembered your password? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
