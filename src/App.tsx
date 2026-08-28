import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { getSalonSettings, getServices, getStaff, areSupabaseTablesMissing } from './lib/dbService';
import { SalonSettings, Service, Staff } from './types';
import SetupBanner from './components/SetupBanner';
import BookingWizard from './components/BookingWizard';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import UserLogin from './components/UserLogin';
import UserSignup from './components/UserSignup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserDashboard from './components/UserDashboard';
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
  ArrowUpRight,
  User,
  Star
} from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Rahul Sharma',
    location: 'Jaipur',
    service: 'Haircut & Beard Grooming',
    rating: 5,
    comment: 'Raj Hair Studio provides exceptional service! The precision haircut and hot towel beard trim made me feel completely refreshed. Highly professional staff.'
  },
  {
    name: 'Priya Verma',
    location: 'Jaipur',
    service: 'Bridal Makeup & Hair Spa',
    rating: 5,
    comment: 'Got my bridal makeup and hair spa done here. The artists are extremely skilled and used top-grade herbal products. Received endless compliments on my big day!'
  },
  {
    name: 'Amit Patel',
    location: 'Jaipur',
    service: 'Keratin Smoothening',
    rating: 5,
    comment: 'My frizzy hair is now silky smooth and manageable. The Keratin treatment results exceeded my expectations. Worth every single rupee!'
  },
  {
    name: 'Sneha Joshi',
    location: 'Jaipur',
    service: 'Advanced Facial & Hair Coloring',
    rating: 5,
    comment: 'The herbal facial gave my skin an instant radiant glow, and the hair coloring looks so vibrant and natural. Best salon experience in Jaipur.'
  }
];

const STYLISTS = [
  {
    name: 'Vikram Singh',
    role: 'Master Stylist & Director',
    experience: '12+ Years Experience',
    specialty: 'Precision Cuts & Advanced Styling',
    imageInitials: 'VS',
    bio: 'Renowned across Jaipur for bespoke precision haircuts and contemporary styling tailored to individual face structures.'
  },
  {
    name: 'Ananya Sharma',
    role: 'Senior Bridal Makeup Artist',
    experience: '9+ Years Experience',
    specialty: 'Bridal Makeovers & Airbrush',
    imageInitials: 'AS',
    bio: 'Certified celebrity makeup artist specializing in flawless bridal looks, traditional aesthetics, and skin preps.'
  },
  {
    name: 'Rohit Meena',
    role: 'Hair Color & Treatment Specialist',
    experience: '8+ Years Experience',
    specialty: 'Balayage, Keratin & Smoothening',
    imageInitials: 'RM',
    bio: 'Expert in ammonia-free organic hair coloring, complex balayage techniques, and deep restorative hair spa therapies.'
  },
  {
    name: 'Pooja Rathore',
    role: 'Skin & Wellness Expert',
    experience: '7+ Years Experience',
    specialty: 'Herbal Facials & Ayurvedic Therapies',
    imageInitials: 'PR',
    bio: 'Dedicated to skin rejuvenation, radiant herbal facials, and relaxing Ayurvedic head massage rituals.'
  }
];

export default function App() {
  const [view, setView] = useState<'public' | 'admin' | 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'user-dashboard'>('public');
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardPreselectedId, setWizardPreselectedId] = useState<string | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Load public settings and services
  const loadPublicData = async () => {
    try {
      const [salonConf, allServices, allStaff] = await Promise.all([
        getSalonSettings(),
        getServices(),
        getStaff()
      ]);
      setSettings(salonConf);
      setActiveServices(allServices.filter(s => s.is_active));
      setStaffList(allStaff.filter(s => s.is_active));
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
      }
    });

    if (window.location.hash.includes('type=recovery')) {
      setView('reset-password');
    }

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
    <div className="min-h-screen flex flex-col bg-[#F8F5F1] text-[#2C2621]">
      {/* 1. SETUP ASSISTANT BANNER */}
      {areSupabaseTablesMissing() && <SetupBanner />}

      {/* ADMIN WORKSPACE VIEW */}
      {view === 'admin' ? (
        <div className="flex-grow flex flex-col">
          {/* Admin Header Navbar */}
          <header className="bg-white border-b border-[#EAE3D9]/50 py-3 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-serif-display text-xl font-bold tracking-wide text-[#5A4D3F]">
                AURA <span className="font-sans text-xs uppercase tracking-widest text-[#A68A64]">Portal</span>
              </span>
            </div>
            
            <button
              onClick={() => setView('public')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#EAE3D9] text-xs font-semibold hover:bg-[#F8F5F1] text-[#7C6A53] cursor-pointer transition-all"
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
      ) : view === 'login' ? (
        <UserLogin 
          onLoginSuccess={(sess) => {
            setSession(sess);
            setView('user-dashboard');
          }}
          onNavigate={(v) => setView(v)}
        />
      ) : view === 'signup' ? (
        <UserSignup 
          onSignupSuccess={() => setView('login')}
          onNavigate={(v) => setView(v)}
        />
      ) : view === 'forgot-password' ? (
        <ForgotPassword 
          onNavigate={(v) => setView(v)}
        />
      ) : view === 'reset-password' ? (
        <ResetPassword 
          onSuccess={() => setView('login')}
          onNavigate={() => setView('login')}
        />
      ) : view === 'user-dashboard' ? (
        <UserDashboard 
          session={session}
          onLogout={() => {
            supabase.auth.signOut();
            setSession(null);
            setView('public');
          }}
          onNavigateHome={() => setView('public')}
          onBookNow={() => {
            setView('public');
            setTimeout(() => handleScrollTo('booking-section'), 100);
          }}
          onRedirectLogin={() => setView('login')}
        />
      ) : (
        /* PUBLIC VISITOR WEBSITE */
        <div className="flex-grow flex flex-col">
          
          {/* navbar */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE3D9]/35 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div 
                onClick={() => handleScrollTo('hero-section')} 
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold tracking-widest text-[#40362D]">
                  AURA
                </h1>
                <span className="text-[9px] uppercase tracking-widest text-[#A68A64] font-bold mt-1.5">BEVERLY HILLS</span>
              </div>

              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-[#7C6A53]">
                <button onClick={() => handleScrollTo('services-section')} className="hover:text-[#40362D] cursor-pointer transition-colors">The Rituals</button>
                <button onClick={() => handleScrollTo('about-section')} className="hover:text-[#40362D] cursor-pointer transition-colors">The House</button>
                <button onClick={() => handleScrollTo('booking-section')} className="hover:text-[#40362D] cursor-pointer transition-colors">Reserve Appointment</button>
                <button onClick={() => setView('admin')} className="hover:text-[#40362D] cursor-pointer transition-colors font-bold text-[#A68A64]">Staff Portal</button>
              </nav>

              {/* Auth / Booking Buttons */}
              <div className="flex items-center gap-3">
                {session ? (
                  <>
                    <button
                      onClick={() => setView('user-dashboard')}
                      className="px-4 py-2 rounded-full border border-[#EAE3D9] text-xs font-bold text-[#7C6A53] hover:bg-[#F8F5F1] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-[#A68A64]" />
                      <span>My Dashboard</span>
                    </button>
                    <button
                      onClick={() => handleScrollTo('booking-section')}
                      className="hidden sm:inline-flex px-5 py-2 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      Book Your Visit
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setView('login')}
                      className="px-3 py-2 text-xs font-bold text-[#7C6A53] hover:text-[#2C2621] transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setView('signup')}
                      className="hidden sm:inline-flex px-4 py-2 rounded-full border border-[#EAE3D9] text-xs font-bold text-[#7C6A53] hover:bg-[#F8F5F1] transition-all cursor-pointer"
                    >
                      Create Account
                    </button>
                    <button
                      onClick={() => handleScrollTo('booking-section')}
                      className="px-5 py-2 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      Book Your Visit
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* HERO SECTION */}
          <section id="hero-section" className="relative bg-[#F8F5F1] overflow-hidden border-b border-[#EAE3D9]/30 py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Text Content */}
                <div className="lg:col-span-6 space-y-6 lg:pr-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE3D9] text-[#7C6A53] text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#A68A64]" />
                    <span>The Epitome of Organic Hair Artistry</span>
                  </div>
                  
                  <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-[#40362D]">
                    Sculpting confidence. Redefining styling.
                  </h2>
                  
                  <p className="text-[#7C6A53] text-base sm:text-lg leading-relaxed max-w-xl">
                    Welcome to {sName}, a boutique luxury hair sanctuary in Beverly Hills. We pair top-tier stylist craftsmanship with pure, bio-active organic treatments to revive your natural brilliance and luster.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleScrollTo('booking-section')}
                      className="px-7 py-3.5 rounded-full bg-[#7C6A53] hover:bg-[#5A4D3F] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Reserve Appointment</span>
                      <ArrowRight className="w-4 h-4 text-[#A68A64]" />
                    </button>
                    <button
                      onClick={() => handleScrollTo('services-section')}
                      className="px-7 py-3.5 rounded-full border border-[#EAE3D9] bg-white hover:bg-[#F8F5F1] text-[#7C6A53] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Explore Our Rituals
                    </button>
                  </div>

                  {/* Highlights Bar */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#EAE3D9]/50">
                    <div>
                      <p className="font-serif-display text-2xl font-bold text-[#A68A64]">01</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#7C6A53] mt-1">Bespoke Coloring</p>
                    </div>
                    <div>
                      <p className="font-serif-display text-2xl font-bold text-[#A68A64]">100%</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#7C6A53] mt-1">Organic Products</p>
                    </div>
                    <div>
                      <p className="font-serif-display text-2xl font-bold text-[#A68A64]">5★</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#7C6A53] mt-1">Stylist Care</p>
                    </div>
                  </div>
                </div>

                {/* Cinematic Layered Visual Image Column */}
                <div className="lg:col-span-6 relative">
                  {/* Decorative warm lighting sphere */}
                  <div className="absolute top-1/4 -left-12 w-64 h-64 rounded-full bg-[#A68A64]/15 blur-3xl z-0" />

                  {/* Asymmetric Image frames */}
                  <div className="grid grid-cols-12 gap-4 relative z-10">
                    <div className="col-span-8">
                      <img 
                        src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80" 
                        alt="High-end hair salon styling" 
                        referrerPolicy="no-referrer"
                        className="rounded-2xl shadow-xl w-full h-[320px] sm:h-[400px] object-cover grayscale-15 border border-[#EAE3D9]/40"
                      />
                    </div>
                    <div className="col-span-4 self-end space-y-4">
                      <img 
                        src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80" 
                        alt="Stylist washing hair with luxury wash" 
                        referrerPolicy="no-referrer"
                        className="rounded-xl shadow-md w-full h-[140px] sm:h-[180px] object-cover border border-[#EAE3D9]/40"
                      />
                      <div className="bg-[#7C6A53] text-[#F8F5F1] p-4 rounded-xl border border-[#A68A64]/20 shadow-lg space-y-2">
                        <span className="text-[8px] uppercase tracking-widest text-[#A68A64] font-bold block">Salon Address</span>
                        <p className="text-xs font-medium leading-relaxed">{sAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SERVICES RITUALS SECTION */}
          <section id="services-section" className="py-20 bg-white border-b border-[#EAE3D9]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">The Signature Experience</span>
                <h3 className="font-serif-display text-4xl font-bold text-[#40362D] mt-2">Bespoke Hair & Salon Rituals</h3>
                <p className="text-[#7C6A53] text-sm sm:text-base mt-2">
                  Explore our comprehensive menu of haircuts, styling, hair spa, grooming, and bridal makeup.
                </p>
              </div>

              {/* Category Filter Tabs */}
              {!loading && activeServices.length > 0 && (() => {
                const categories = ['All', ...Array.from(new Set(activeServices.map(s => s.category || 'Hair Services')))];
                const filteredServices = activeCategory === 'All' 
                  ? activeServices 
                  : activeServices.filter(s => (s.category || 'Hair Services') === activeCategory);

                return (
                  <div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            activeCategory === cat
                              ? 'bg-[#7C6A53] text-white shadow-md'
                              : 'bg-[#F8F5F1] text-[#7C6A53] hover:bg-[#EAE3D9]/60 border border-[#EAE3D9]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredServices.map(service => (
                        <div 
                          key={service.id}
                          className="bg-[#F8F5F1] border border-[#EAE3D9]/40 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:border-[#A68A64]/50 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-4 pb-3 border-b border-[#EAE3D9]/20 mb-3">
                              <div>
                                <span className="text-[10px] uppercase tracking-widest text-[#A68A64] font-bold block mb-1">
                                  {service.category || 'Hair Services'}
                                </span>
                                <h4 className="font-serif-display text-lg font-bold text-[#40362D]">{service.name}</h4>
                              </div>
                              <span className="text-base font-bold text-[#A68A64] whitespace-nowrap">₹{service.price}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#7C6A53] leading-relaxed mb-6">
                              {service.description || 'Tailored boutique treatment personalized to your styling needs.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#EAE3D9]/20">
                            <span className="text-xs text-[#7C6A53] font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#A68A64]" />
                              {service.duration_minutes} Minutes
                            </span>
                            
                            <button
                              onClick={() => handlePreselectService(service.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#7C6A53] text-[#7C6A53] hover:text-white transition-all border border-[#EAE3D9] hover:border-[#7C6A53] text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              <span>Reserve</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <div className="w-8 h-8 border-3 border-[#A68A64]/20 border-t-[#A68A64] rounded-full animate-spin" />
                  <p className="text-xs text-[#7C6A53]">Synchronizing price boards...</p>
                </div>
              )}
            </div>
          </section>

          {/* ABOUT HOUSE PHILOSOPHY SECTION */}
          <section id="about-section" className="py-20 bg-[#F8F5F1] border-b border-[#EAE3D9]/30">
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
                    <div className="bg-[#F8F5F1] border border-[#EAE3D9] p-4 rounded-xl text-center">
                      <p className="font-serif-display text-4xl font-bold text-[#A68A64]">20+</p>
                      <p className="text-[8px] uppercase tracking-widest font-bold text-[#7C6A53] mt-1">Years Stylist Pedigree</p>
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
                  <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">The Craft Philosophy</span>
                  <h3 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#40362D]">
                    Crafting custom styling in a warm, welcoming space.
                  </h3>
                  <p className="text-[#7C6A53] text-sm sm:text-base leading-relaxed">
                    At AURA, we believe that luxury hair styling is more than a simple appointment; it is a sacred self-care ritual. We strive to create an inclusive, calm environment where each guest receives individual attention from some of the industry's most talented, certified hair artists.
                  </p>
                  <p className="text-[#7C6A53] text-sm sm:text-base leading-relaxed">
                    We formulated our entire salon catalog using exclusively biodynamic, vegan color treatments and sustainable botanical extracts. No ammonia, no chemical odors—just pure, nourishing therapies that breathe health and shine back into your tresses.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#7C6A53]/5 flex items-center justify-center text-[#A68A64] shrink-0">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#40362D] uppercase tracking-wider">Holistic Styling Care</p>
                        <p className="text-xs text-[#7C6A53] mt-1 leading-relaxed">Personalized hair texture evaluation with customized moisturizing glosses.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#7C6A53]/5 flex items-center justify-center text-[#A68A64] shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#40362D] uppercase tracking-wider">Master Colorists</p>
                        <p className="text-xs text-[#7C6A53] mt-1 leading-relaxed">Specialized balayages and dimensional pigments configured for your skin undertone.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MEET OUR ARTISTS SECTION */}
          <section className="py-20 bg-[#F8F5F1] border-b border-[#EAE3D9]/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Expert Professionals</span>
                <h3 className="font-serif-display text-4xl font-bold text-[#40362D] mt-2">Meet Our Artists</h3>
                <p className="text-[#7C6A53] text-sm sm:text-base mt-2">
                  Our talented team of certified stylists, colorists, and makeup artists bring years of expertise and passion to every appointment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(staffList.length > 0 ? staffList : STYLISTS.map((s, i) => ({
                  id: String(i),
                  name: s.name,
                  role: s.role,
                  experience: s.experience,
                  specialty: s.specialty,
                  image_url: `https://images.unsplash.com/photo-${1534528741775 + i * 1000}?w=400&auto=format&fit=crop&q=80`,
                  bio: s.bio,
                  is_active: true
                }))).map((artist, idx) => (
                  <div 
                    key={artist.id || idx}
                    className="bg-white border border-[#EAE3D9]/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Portrait image */}
                      <div className="mb-5 mx-auto w-20 h-20 rounded-2xl overflow-hidden border border-[#EAE3D9] shadow-sm">
                        <img 
                          src={artist.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                          alt={artist.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-center mb-4">
                        <h4 className="font-serif-display text-lg font-bold text-[#40362D]">{artist.name}</h4>
                        <p className="text-xs font-bold text-[#A68A64] uppercase tracking-wider mt-0.5">{artist.role}</p>
                        <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-[#F8F5F1] text-[10px] font-bold text-[#7C6A53] border border-[#EAE3D9]">
                          {artist.experience}
                        </span>
                      </div>

                      <p className="text-xs text-[#7C6A53] leading-relaxed text-center mb-6">
                        {artist.bio}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#EAE3D9]/40 text-center">
                      <p className="text-[11px] font-semibold text-[#40362D]">Specialty: <span className="text-[#A68A64]">{artist.specialty}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIALS SECTION */}
          <section className="py-20 bg-white border-b border-[#EAE3D9]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs uppercase tracking-widest text-[#A68A64] font-bold">Client Experiences</span>
                <h3 className="font-serif-display text-4xl font-bold text-[#40362D] mt-2">Loved by Our Guests</h3>
                <p className="text-[#7C6A53] text-sm sm:text-base mt-2">
                  Read genuine reviews from our valued patrons across Jaipur who trust us with their hair and beauty rituals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TESTIMONIALS.map((t, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#F8F5F1] border border-[#EAE3D9]/50 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-1">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#A68A64] text-[#A68A64]" />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-[#40362D] italic leading-relaxed">
                        "{t.comment}"
                      </p>
                    </div>

                    <div className="pt-4 mt-6 border-t border-[#EAE3D9]/40 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#40362D]">{t.name}</p>
                        <p className="text-[10px] text-[#A68A64] font-medium">{t.service} • {t.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
          <footer className="bg-[#2C2621] text-white pt-16 pb-8 border-t border-[#EAE3D9]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              
              {/* Grid block */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Brand overview */}
                <div className="md:col-span-5 space-y-4">
                  <div className="flex items-baseline gap-1.5">
                    <h4 className="font-serif-display text-2xl font-bold tracking-widest text-white">AURA</h4>
                    <span className="text-[8px] uppercase tracking-widest text-[#A68A64] font-bold">BEVERLY HILLS</span>
                  </div>
                  <p className="text-xs text-[#EAE3D9]/70 leading-relaxed max-w-sm">
                    Luxury hair salon combining hand-painted coloring and organic botanical gloss therapies. Crafting healthy, bespoke hair transformations.
                  </p>
                  <p className="text-[10px] text-[#A68A64] font-bold">
                    © 2026 AURA Hair Salon. Designed with World-Class Pedigree.
                  </p>
                </div>

                {/* Contacts Coordinates */}
                <div className="md:col-span-4 space-y-3.5">
                  <h5 className="text-[10px] uppercase tracking-widest font-bold text-[#A68A64]">The Sanctuary Coordinates</h5>
                  <div className="space-y-2.5 text-xs text-[#EAE3D9]/80">
                    <p className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#A68A64] shrink-0 mt-0.5" />
                      <span>{sAddress}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#A68A64] shrink-0" />
                      <span>{sPhone}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-[#A68A64] shrink-0" />
                      <span>{sEmail}</span>
                    </p>
                  </div>
                </div>

                {/* Portal and Links */}
                <div className="md:col-span-3 space-y-3.5">
                  <h5 className="text-[10px] uppercase tracking-widest font-bold text-[#A68A64]">Concierge Portal</h5>
                  <p className="text-xs text-[#EAE3D9]/70 leading-relaxed">
                    Stylists and salon coordinators can log in to access registers and update client bookings.
                  </p>
                  <button
                    onClick={() => {
                      setView('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#A68A64]/30 hover:bg-white/10 text-[#A68A64] hover:text-white transition-all text-[10px] uppercase tracking-wider font-bold cursor-pointer"
                  >
                    <span>Administrative Login</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom tag */}
              <div className="border-t border-[#EAE3D9]/10 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#EAE3D9]/50 gap-4">
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
