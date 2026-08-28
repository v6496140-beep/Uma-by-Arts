import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface UserSignupProps {
  onSignupSuccess: () => void;
  onNavigate: (view: 'public' | 'login' | 'admin') => void;
}

export default function UserSignup({ onSignupSuccess, onNavigate }: UserSignupProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Account created successfully! Redirecting to sign in...');
      setTimeout(() => {
        onSignupSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMsg(err.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#EAE3D9]/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#F8F5F1] px-6 py-8 text-center border-b border-[#EAE3D9]/40 relative">
          <button
            onClick={() => onNavigate('public')}
            className="absolute top-4 left-4 text-xs font-semibold text-[#7C6A53] hover:text-[#2C2621] transition-colors"
          >
            ← Back to Home
          </button>
          
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#EAE3D9] shadow-sm mb-3">
            <Sparkles className="w-5 h-5 text-[#A68A64]" />
          </div>
          <h2 className="font-serif-display text-2xl font-bold text-[#2C2621]">Create Account</h2>
          <p className="text-xs text-[#7C6A53] mt-1">Join AURA Hair Salon for seamless appointment booking</p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE3D9] bg-[#F8F5F1]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]/50 focus:bg-white text-[#2C2621]"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-xs font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#EAE3D9] bg-[#F8F5F1]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]/50 focus:bg-white text-[#2C2621]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7C6A53] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE3D9] bg-[#F8F5F1]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]/50 focus:bg-white text-[#2C2621]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#7C6A53] hover:bg-[#5A4D3F] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-[#EAE3D9]/40 space-y-3">
            <p className="text-xs text-[#7C6A53]">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="font-bold text-[#A68A64] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
