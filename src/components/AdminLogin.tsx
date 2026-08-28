import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { checkAdminUser, areSupabaseTablesMissing } from '../lib/dbService';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, AlertTriangle, LogOut } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (session: any) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  // Auto-check active session on mount
  useEffect(() => {
    async function checkActiveSession() {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          const isAdmin = await checkAdminUser(session.user.id);
          if (isAdmin) {
            onLoginSuccess(session);
          } else {
            setWarningMsg("You are signed in, but you are not authorized as an admin.");
          }
        }
      } catch (err) {
        console.error("Error checking session", err);
      } finally {
        setLoading(false);
      }
    }
    checkActiveSession();
  }, [onLoginSuccess]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSigningIn(true);
    setErrorMsg('');
    setWarningMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Enforce the admin check by user_id
        const isAdmin = await checkAdminUser(data.user.id);
        
        if (isAdmin) {
          onLoginSuccess(data.session);
        } else {
          // If signed in but not authorized as admin, sign them out immediately
          await supabase.auth.signOut();
          setWarningMsg("You are signed in, but you are not authorized as an admin.");
        }
      }
    } catch (err: any) {
      console.error("Sign-in error", err);
      setErrorMsg(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setWarningMsg('');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-10 h-10 border-4 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#8B7E74]">Validating secure session credentials...</p>
      </div>
    );
  }

  // Check if Supabase tables are missing to provide a guide
  const isLocalFallbackActive = areSupabaseTablesMissing();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#EADCC9]/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Branding banner */}
        <div className="bg-[#3E3C3A] text-white p-8 text-center relative border-b border-[#EADCC9]/20">
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] bg-white/10 text-[#C5A880] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Secure SSL Access</span>
          </div>
          
          <h3 className="font-serif-display text-3xl font-bold tracking-wide">AURA Salon</h3>
          <p className="text-xs text-[#EADCC9] uppercase tracking-widest mt-1">Bespoke Concierge Portal</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h4 className="text-sm font-semibold text-[#1F1E1D]">Administrative Sign In</h4>
            <p className="text-xs text-[#8B7E74] mt-1">Access requires verified credential privileges.</p>
          </div>

          {isLocalFallbackActive && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Database Fallback Mode</p>
                <p className="mt-0.5 leading-relaxed text-amber-700">
                  Supabase tables aren't created yet, so you can test the dashboard by entering any email/password (e.g., <code className="font-mono bg-white px-1">admin@aura.com</code> / <code className="font-mono bg-white px-1">password</code>). To make it real, apply the SQL script from the assistant banner!
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {warningMsg && (
            <div className="p-4 bg-[#F9F7F4] border border-[#EADCC9] rounded-lg text-center space-y-3">
              <p className="text-xs font-semibold text-red-600">{warningMsg}</p>
              <p className="text-[11px] text-[#8B7E74]">
                To grant admin rights to this user, run the SQL script to insert their UID into the <code className="bg-white px-1 py-0.5 border border-[#EADCC9]/50 font-mono">admin_users</code> table in Supabase.
              </p>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Account</span>
              </button>
            </div>
          )}

          {!warningMsg && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1" htmlFor="email">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A880]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="concierge@aurasalon.com"
                    className="w-full bg-white border border-[#EADCC9] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 transition-all text-[#1F1E1D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1" htmlFor="password">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A880]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-[#EADCC9] rounded-lg pl-9 pr-10 py-2 text-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 transition-all text-[#1F1E1D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7E74] hover:text-[#3E3C3A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="w-full py-2.5 rounded-lg bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              >
                {signingIn ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Verifying Permissions...</span>
                  </>
                ) : (
                  <span>Authenticate Access</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
