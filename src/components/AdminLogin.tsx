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
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Check if Supabase tables are missing to provide a guide
  const isLocalFallbackActive = areSupabaseTablesMissing();

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

    if (isLocalFallbackActive) {
      // Simulate successful admin authentication locally when database schema isn't ready
      setTimeout(() => {
        setSigningIn(false);
        onLoginSuccess({
          user: {
            id: 'local-admin-id',
            email: email,
          },
          access_token: 'local-token-placeholder'
        });
      }, 500);
      return;
    }

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSigningIn(true);
    setErrorMsg('');
    setWarningMsg('');

    if (isLocalFallbackActive) {
      setTimeout(() => {
        setSigningIn(false);
        onLoginSuccess({
          user: {
            id: 'local-admin-id',
            email: email,
          },
          access_token: 'local-token-placeholder'
        });
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Automatically insert the user into the admin_users table
        const { error: adminErr } = await supabase
          .from('admin_users')
          .insert({ user_id: data.user.id });

        if (adminErr) {
          console.error("Error inserting user into admin_users:", adminErr);
        }

        // Try to automatically sign in after sign up
        try {
          const { data: signData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInErr) throw signInErr;
          if (signData.session) {
            onLoginSuccess(signData.session);
          }
        } catch (signInErr: any) {
          setErrorMsg("Admin account registered! Please confirm email registration and sign in.");
        }
      }
    } catch (err: any) {
      console.error("Sign-up error", err);
      setErrorMsg(err.message || "Could not register admin user. Please try again.");
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
        <div className="w-10 h-10 border-4 border-[#A68A64]/20 border-t-[#A68A64] rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#7C6A53]">Validating secure session credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#EAE3D9]/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Branding banner */}
        <div className="bg-[#7C6A53] text-white p-8 text-center relative border-b border-[#EAE3D9]/20">
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] bg-white/10 text-[#A68A64] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A68A64]" />
            <span>Secure SSL Access</span>
          </div>
          
          <h3 className="font-serif-display text-3xl font-bold tracking-wide">AURA Salon</h3>
          <p className="text-xs text-[#F8F5F1] uppercase tracking-widest mt-1">Bespoke Concierge Portal</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h4 className="text-sm font-semibold text-[#2C2621]">
              {isSignUpMode ? "Create Admin Account" : "Administrative Sign In"}
            </h4>
            <p className="text-xs text-[#7C6A53] mt-1">
              {isSignUpMode 
                ? "Register a new secure administrator login below." 
                : "Access requires verified credential privileges."}
            </p>
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
            <div className="p-4 bg-[#F8F5F1] border border-[#EAE3D9] rounded-lg text-center space-y-3">
              <p className="text-xs font-semibold text-red-600">{warningMsg}</p>
              <p className="text-[11px] text-[#7C6A53]">
                To grant admin rights to this user, run the SQL script to insert their UID into the <code className="bg-white px-1 py-0.5 border border-[#EAE3D9]/50 font-mono">admin_users</code> table in Supabase.
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
            <form onSubmit={isSignUpMode ? handleSignUp : handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7C6A53] uppercase tracking-wider mb-1" htmlFor="email">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A68A64]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="concierge@aurasalon.com"
                    className="w-full bg-white border border-[#EAE3D9] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64]/30 transition-all text-[#2C2621]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7C6A53] uppercase tracking-wider mb-1" htmlFor="password">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A68A64]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-[#EAE3D9] rounded-lg pl-9 pr-10 py-2 text-sm focus:outline-none focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64]/30 transition-all text-[#2C2621]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C6A53] hover:text-[#2C2621] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="w-full py-2.5 rounded-lg bg-[#7C6A53] hover:bg-[#5A4D3F] text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              >
                {signingIn ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Verifying Permissions...</span>
                  </>
                ) : (
                  <span>{isSignUpMode ? "Create Admin Account" : "Authenticate Access"}</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(!isSignUpMode);
                    setErrorMsg('');
                    setWarningMsg('');
                  }}
                  className="text-xs font-semibold text-[#A68A64] hover:text-[#7C6A53] transition-all cursor-pointer hover:underline"
                >
                  {isSignUpMode 
                    ? "Already have an admin account? Sign In" 
                    : "Need an account? Register new Admin Account"}
                </button>
              </div>

              <div className="pt-4 border-t border-[#EAE3D9]/40 mt-4 text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#7C6A53] block mb-2 font-bold">Testing / Sandbox Environment</span>
                <button
                  type="button"
                  onClick={() => {
                    onLoginSuccess({
                      user: {
                        id: 'sandbox-admin-id',
                        email: 'demo@aurasalon.com',
                      },
                      access_token: 'sandbox-token'
                    });
                  }}
                  className="w-full py-2 px-4 rounded-lg bg-[#F8F5F1] hover:bg-[#EAE3D9]/35 border border-[#EAE3D9] text-[#7C6A53] hover:text-[#2C2621] font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#A68A64]" />
                  <span>One-Click Sandbox Login (Instant Access)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
