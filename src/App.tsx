import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { getSalonSettings, getServices, areSupabaseTablesMissing } from './lib/dbService';
import { SalonSettings, Service } from './types';
import SetupBanner from './components/SetupBanner';
import BookingWizard from './components/BookingWizard';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { 
  Scissors, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CalendarDays, 
  Sparkles, 
  ArrowRight, 
  UserCheck, 
  ChevronRight, 
  Heart,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardPreselectedId, setWizardPreselectedId] = useState<string | undefined>(undefined);

  // Load public settings and services
  const loadPublicData = async () => {
    try {
      const [salonConf, allServices] = await Promise.all([
        getSalonSettings(),
        getServices()
      ]);
      setSettings(salonConf);
      setActiveServices(allServices.filter(s => s.is_active));
    } catch (err) {
      console.error("Could not fetch public app data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();

    // Check active auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePreselectService = (serviceId: string) => {
    setWizardPreselectedId(serviceId);
    handleScrollTo('booking-section');
  };

  // Safe Fallback Display Coordinates
  const sName = settings?.salon_name || "AURA Hair Salon";
  const sPhone = settings?.salon_phone || "+1 (555) 890-4200";
  const sEmail = settings?.salon_email || "concierge@aurasalon.com";
  const sAddress = settings?.salon_address || "420 N. Beverly Drive, Beverly Hills, CA 90210";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1F1E1D]">
      {/* 1. SETUP ASSISTANT BANNER */}
      {areSupabaseTablesMissing() && <SetupBanner />}

      {/* ADMIN WORKSPACE VIEW */}
      {view === 'admin' ? (
        <div className="flex-grow flex flex-col">
          {/* Admin Header Navbar */}
          <header className="bg-white border-b border-[#EADCC9]/50 py-3 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-serif-display text-xl font-bold tracking-wide text-[#3E3C3A]">
                AURA <span className="font-sans text-xs uppercase tracking-widest text-[#C5A880]">Portal</span>
              </span>
            </div>
            
            <button
              onClick={() => setView('public')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#EADCC9] text-xs font-semibold hover:bg-[#FAF8F5] text-[#3E3C3A] cursor-pointer transition-all"
            >
              <span>← Back to Public Website</span>
            </button>
          </header>

          {/* Core admin stages */}
          <div className="flex-grow p-4 sm:p-6 lg:p-8 bg-[#F9F7F4]">
            {session ? (
              <AdminDashboard onLogout={() => setSession(null)} />
            ) : (
              <AdminLogin onLoginSuccess={(sess) => setSession(sess)} />
            )}
          </div>
        </div>
      ) : (
        /* PUBLIC VISITOR WEBSITE */
        <div className="flex-grow flex flex-col">
          
          {/* AURA Admin State Quick Strip */}
          {session && (
            <div className="bg-[#3E3C3A] text-white py-2 px-4 text-xs font-medium border-b border-[#C5A880]/20">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Logged in as AURA Manager concierge</span>
                </span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setView('admin')}
                    className="font-bold text-[#C5A880] hover:underline uppercase tracking-wider text-[10px]"
                  >
                    Enter Admin Console
                  </button>
                  <button
                    onClick={() => supabase.auth.signOut().then(() => setSession(null))}
                    className="text-neutral-400 hover:text-white uppercase tracking-wider text-[10px]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* navbar */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EADCC9]/35 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div 
                onClick={() => handleScrollTo('hero-section')} 
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold tracking-widest text-[#3E3C3A]">
                  AURA
                </h1>
                <span className="text-[9px] uppercase tracking-widest text-[#C5A880] font-bold mt-1.5">BEVERLY HILLS</span>
              </div>

              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-[#8B7E74]">
                <button onClick={() => handleScrollTo('services-section')} className="hover:text-[#3E3C3A] cursor-pointer transition-colors">The Rituals</button>
                <button onClick={() => handleScrollTo('about-section')} className="hover:text-[#3E3C3A] cursor-pointer transition-colors">The House</button>
                <button onClick={() => handleScrollTo('booking-section')} className="hover:text-[#3E3C3A] cursor-pointer transition-colors">Reserve Appointment</button>
                <button onClick={() => setView('admin')} className="hover:text-[#3E3C3A] cursor-pointer transition-colors font-bold text-[#C5A880]">Portal Access</button>
              </nav>

              {/* Booking Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleScrollTo('booking-section')}
                  className="px-5 py-2 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer hover:shadow-md hover:translate-y-[-1px]"
                >
                  Book Your Visit
                </button>
              </div>
            </div>
          </header>

          {/* HERO SECTION */}
          <section id="hero-section" className="relative bg-[#FAF8F5] overflow-hidden border-b border-[#EADCC9]/30 py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Text Content */}
                <div className="lg:col-span-6 space-y-6 lg:pr-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3ECE0] text-[#3E3C3A] text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>The Epitome of Organic Hair Artistry</span>
                  </div>
                  
                  <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-[#3E3C3A]">
                    Sculpting confidence. Redefining styling.
                  </h2>
                  
                  <p className="text-[#8B7E74] text-base sm:text-lg leading-relaxed max-w-xl">
                    Welcome to {sName}, a boutique luxury hair sanctuary in Beverly Hills. We pair top-tier stylist craftsmanship with pure, bio-active organic treatments to revive your natural brilliance and luster.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleScrollTo('booking-section')}
                      className="px-7 py-3.5 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Reserve Appointment</span>
                      <ArrowRight className="w-4 h-4 text-[#C5A880]" />
                    </button>
                    <button
                      onClick={() => handleScrollTo('services-section')}
                      className="px-7 py-3.5 rounded-full border border-[#EADCC9] bg-white hover:bg-[#FAF8F5] text-[#3E3C3A] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Explore Our Rituals
                    </button>
                  </div>

                  {/* Highlights Bar */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#EADCC9]/50">
                    <div>
                      <p className="font-serif-display text-2xl font-bold text-[#C5A880]">01</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8B7E74] mt-1">Bespoke Coloring</p>
                    </div>
                    <div>
                      <p className="font-serif-display text-2xl font-bold text-[#C5A880]">100%</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8B7E74] mt-1">Organic Products</p>
                    </div>
                    <div>
                      <p className="font-serif-display text-2xl font-bold text-[#C5A880]">5★</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8B7E74] mt-1">Stylist Care</p>
                    </div>
                  </div>
                </div>

                {/* Cinematic Layered Visual Image Column */}
                <div className="lg:col-span-6 relative">
                  {/* Decorative warm lighting sphere */}
                  <div className="absolute top-1/4 -left-12 w-64 h-64 rounded-full bg-[#C5A880]/15 blur-3xl z-0" />

                  {/* Asymmetric Image frames */}
                  <div className="grid grid-cols-12 gap-4 relative z-10">
                    <div className="col-span-8">
                      <img 
                        src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80" 
                        alt="High-end hair salon styling" 
                        referrerPolicy="no-referrer"
                        className="rounded-2xl shadow-xl w-full h-[320px] sm:h-[400px] object-cover grayscale-15 border border-[#EADCC9]/40"
                      />
                    </div>
                    <div className="col-span-4 self-end space-y-4">
                      <img 
                        src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80" 
                        alt="Stylist washing hair with luxury wash" 
                        referrerPolicy="no-referrer"
                        className="rounded-xl shadow-md w-full h-[140px] sm:h-[180px] object-cover border border-[#EADCC9]/40"
                      />
                      <div className="bg-[#3E3C3A] text-[#FAF8F5] p-4 rounded-xl border border-[#C5A880]/20 shadow-lg space-y-2">
                        <span className="text-[8px] uppercase tracking-widest text-[#C5A880] font-bold block">Salon Address</span>
                        <p className="text-xs font-medium leading-relaxed">{sAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SERVICES RITUALS SECTION */}
          <section id="services-section" className="py-20 bg-white border-b border-[#EADCC9]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">The Signature Experience</span>
                <h3 className="font-serif-display text-4xl font-bold text-[#3E3C3A] mt-2">Bespoke Hair Rituals</h3>
                <p className="text-[#8B7E74] text-sm sm:text-base mt-2">
                  Our core services combine restorative hair diagnostics with premium botanical coloring and custom styling.
                </p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <div className="w-8 h-8 border-3 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin" />
                  <p className="text-xs text-[#8B7E74]">Synchronizing price boards...</p>
                </div>
              ) : activeServices.length === 0 ? (
                <div className="text-center py-12 max-w-md mx-auto border border-dashed border-[#EADCC9] rounded-xl bg-[#FAF8F5]">
                  <p className="text-sm font-semibold text-[#3E3C3A]">Rituals catalog is updating.</p>
                  <p className="text-xs text-[#8B7E74] mt-0.5">Please check back soon or consult via phone.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeServices.map(service => (
                    <div 
                      key={service.id}
                      className="bg-[#FAF8F5] border border-[#EADCC9]/40 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:border-[#C5A880]/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4 pb-4 border-b border-[#EADCC9]/20 mb-4">
                          <h4 className="font-serif-display text-lg font-bold text-[#3E3C3A]">{service.name}</h4>
                          <span className="text-base font-bold text-[#C5A880]">${service.price}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#8B7E74] leading-relaxed mb-6">
                          {service.description || 'Tailored boutique treatment personalized to your scalp type and desired profile styling.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#EADCC9]/20">
                        <span className="text-xs text-[#8B7E74] font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                          {service.duration_minutes} Minutes
                        </span>
                        
                        <button
                          onClick={() => handlePreselectService(service.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#3E3C3A] text-[#3E3C3A] hover:text-white transition-all border border-[#EADCC9] hover:border-[#3E3C3A] text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <span>Reserve</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ABOUT HOUSE PHILOSOPHY SECTION */}
          <section id="about-section" className="py-20 bg-[#FAF8F5] border-b border-[#EADCC9]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Images Column */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4 relative">
                  <div className="space-y-4">
                    <img 
                      src="https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=400&q=80" 
                      alt="Hair washing details close-up" 
                      referrerPolicy="no-referrer"
                      className="rounded-xl shadow-md w-full h-[220px] object-cover"
                    />
                    <div className="bg-[#FAF8F5] border border-[#EADCC9] p-4 rounded-xl text-center">
                      <p className="font-serif-display text-4xl font-bold text-[#C5A880]">20+</p>
                      <p className="text-[8px] uppercase tracking-widest font-bold text-[#8B7E74] mt-1">Years Stylist Pedigree</p>
                    </div>
                  </div>
                  <div className="pt-8">
                    <img 
                      src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80" 
                      alt="Elegant hair curls" 
                      referrerPolicy="no-referrer"
                      className="rounded-xl shadow-md w-full h-[300px] object-cover"
                    />
                  </div>
                </div>

                {/* About details */}
                <div className="lg:col-span-7 space-y-6">
                  <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">The Craft Philosophy</span>
                  <h3 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#3E3C3A]">
                    Crafting custom styling in a warm, welcoming space.
                  </h3>
                  <p className="text-[#8B7E74] text-sm sm:text-base leading-relaxed">
                    At AURA, we believe that luxury hair styling is more than a simple appointment; it is a sacred self-care ritual. We strive to create an inclusive, calm environment where each guest receives individual attention from some of the industry's most talented, certified hair artists.
                  </p>
                  <p className="text-[#8B7E74] text-sm sm:text-base leading-relaxed">
                    We formulated our entire salon catalog using exclusively biodynamic, vegan color treatments and sustainable botanical extracts. No ammonia, no chemical odors—just pure, nourishing therapies that breathe health and shine back into your tresses.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3E3C3A]/5 flex items-center justify-center text-[#C5A880] shrink-0">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3E3C3A] uppercase tracking-wider">Holistic Styling Care</p>
                        <p className="text-xs text-[#8B7E74] mt-1 leading-relaxed">Personalized hair texture evaluation with customized moisturizing glosses.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3E3C3A]/5 flex items-center justify-center text-[#C5A880] shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3E3C3A] uppercase tracking-wider">Master Colorists</p>
                        <p className="text-xs text-[#8B7E74] mt-1 leading-relaxed">Specialized balayages and dimensional pigments configured for your skin undertone.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ACTIVE BOOKING WIZARD PORT */}
          <section id="booking-section" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <BookingWizard selectedServiceId={wizardPreselectedId} />
            </div>
          </section>

          {/* BRAND FOOTER */}
          <footer className="bg-[#3E3C3A] text-white pt-16 pb-8 border-t border-[#EADCC9]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              
              {/* Grid block */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Brand overview */}
                <div className="md:col-span-5 space-y-4">
                  <div className="flex items-baseline gap-1.5">
                    <h4 className="font-serif-display text-2xl font-bold tracking-widest text-white">AURA</h4>
                    <span className="text-[8px] uppercase tracking-widest text-[#C5A880] font-bold">BEVERLY HILLS</span>
                  </div>
                  <p className="text-xs text-[#EADCC9]/70 leading-relaxed max-w-sm">
                    Luxury hair salon combining hand-painted coloring and organic botanical gloss therapies. Crafting healthy, bespoke hair transformations.
                  </p>
                  <p className="text-[10px] text-[#C5A880] font-bold">
                    © 2026 AURA Hair Salon. Designed with World-Class Pedigree.
                  </p>
                </div>

                {/* Contacts Coordinates */}
                <div className="md:col-span-4 space-y-3.5">
                  <h5 className="text-[10px] uppercase tracking-widest font-bold text-[#C5A880]">The Sanctuary Coordinates</h5>
                  <div className="space-y-2.5 text-xs text-[#EADCC9]/80">
                    <p className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                      <span>{sAddress}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#C5A880] shrink-0" />
                      <span>{sPhone}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-[#C5A880] shrink-0" />
                      <span>{sEmail}</span>
                    </p>
                  </div>
                </div>

                {/* Portal and Links */}
                <div className="md:col-span-3 space-y-3.5">
                  <h5 className="text-[10px] uppercase tracking-widest font-bold text-[#C5A880]">Concierge Portal</h5>
                  <p className="text-xs text-[#EADCC9]/70 leading-relaxed">
                    Stylists and salon coordinators can log in to access registers and update client bookings.
                  </p>
                  <button
                    onClick={() => {
                      setView('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#C5A880]/30 hover:bg-white/10 text-[#C5A880] hover:text-white transition-all text-[10px] uppercase tracking-wider font-bold cursor-pointer"
                  >
                    <span>Administrative Login</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom tag */}
              <div className="border-t border-[#EADCC9]/10 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#EADCC9]/50 gap-4">
                <div className="flex gap-4">
                  <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacy Charter</a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Booking Policy</a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Terms of Use</a>
                </div>
                <div>
                  Protected by SSL Secure Authentication System.
                </div>
              </div>

            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
