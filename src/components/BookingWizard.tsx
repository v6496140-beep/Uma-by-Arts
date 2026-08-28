import React, { useState, useEffect } from 'react';
import { getServices, getAvailableSlots, createAppointment, getBlockedDates, getBusinessHours } from '../lib/dbService';
import { Service, TimeSlot, Appointment } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Printer, 
  CalendarDays,
  Sparkles,
  MapPin,
  HelpCircle
} from 'lucide-react';

interface BookingWizardProps {
  onSuccess?: (app: Appointment) => void;
  selectedServiceId?: string;
}

export default function BookingWizard({ onSuccess, selectedServiceId }: BookingWizardProps) {
  // Booking Steps: 1 = Service, 2 = Date & Time, 3 = Personal Details, 4 = Success
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Calendar UI navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Load services, business hours, and blocked dates
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingServices(true);
        const [allServices, blocks, hours] = await Promise.all([
          getServices(),
          getBlockedDates(),
          getBusinessHours()
        ]);
        
        // Only show active services in public flow
        const active = allServices.filter(s => s.is_active);
        setServices(active);
        
        setBlockedDates(blocks.map(b => b.blocked_date));
        setBusinessHours(hours);

        // Pre-select service if passed as prop
        if (selectedServiceId && active.length > 0) {
          const match = active.find(s => s.id === selectedServiceId);
          if (match) {
            setSelectedService(match);
            setStep(2);
          }
        }
      } catch (err) {
        console.error('Error loading booking data', err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadData();
  }, [selectedServiceId]);

  // Load available slots when service or date selection changes
  useEffect(() => {
    if (selectedService && selectedDateStr) {
      async function fetchSlots() {
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
          const slots = await getAvailableSlots(selectedService!, selectedDateStr);
          setAvailableSlots(slots);
        } catch (err) {
          console.error('Error loading slots', err);
        } finally {
          setLoadingSlots(false);
        }
      }
      fetchSlots();
    }
  }, [selectedService, selectedDateStr]);

  // Helpers for calendar rendering
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateSelectable = (dateStr: string, dateObj: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Check past dates
    if (dateObj < today) return false;

    // Check blocked dates
    if (blockedDates.includes(dateStr)) return false;

    // Check business hours
    const dayOfWeek = dateObj.getDay();
    const dayHour = businessHours.find(h => h.weekday === dayOfWeek);
    if (!dayHour || !dayHour.is_open) return false;

    return true;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return (
      <div className="bg-[#FAF8F5] border border-[#EADCC9] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-serif-display text-xl font-semibold text-[#3E3C3A]">{monthName}</h4>
          <div className="flex gap-1.5">
            <button
              onClick={handlePrevMonth}
              type="button"
              className="p-1.5 rounded-lg border border-[#EADCC9] bg-white hover:bg-[#F3ECE0] text-[#8B7E74] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              type="button"
              className="p-1.5 rounded-lg border border-[#EADCC9] bg-white hover:bg-[#F3ECE0] text-[#8B7E74] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekdays.map(d => (
            <div key={d} className="text-xs font-semibold text-[#8B7E74] py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {totalSlots.map((day, idx) => {
            if (day === null) {
              return <div key={`blank-${idx}`} className="py-2.5" />;
            }

            const year = currentMonth.getFullYear();
            const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${dayStr}`;
            const dateObj = new Date(year, currentMonth.getMonth(), day);
            
            const selectable = isDateSelectable(dateStr, dateObj);
            const isSelected = selectedDateStr === dateStr;

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => selectable && setSelectedDateStr(dateStr)}
                disabled={!selectable}
                className={`py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-[#3E3C3A] text-white shadow-md scale-105 font-bold' 
                    : selectable 
                      ? 'bg-white text-[#1F1E1D] border border-[#FAF8F5] hover:border-[#C5A880] hover:bg-[#FAF8F5]' 
                      : 'bg-[#F9F7F4] text-neutral-300 cursor-not-allowed line-through'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-xs justify-center border-t border-[#EADCC9]/50 pt-3 text-[#8B7E74]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-[#EADCC9]"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#3E3C3A]"></span>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F9F7F4] border border-[#EADCC9]/30 line-through text-neutral-300"></span>
            <span>Closed/Blocked</span>
          </div>
        </div>
      </div>
    );
  };

  // Group slots by time of day
  const getGroupedSlots = () => {
    const grouped = {
      morning: [] as TimeSlot[],
      afternoon: [] as TimeSlot[],
      evening: [] as TimeSlot[]
    };

    availableSlots.forEach(slot => {
      const hour = slot.start.getHours();
      if (hour < 12) {
        grouped.morning.push(slot);
      } else if (hour < 17) {
        grouped.afternoon.push(slot);
      } else {
        grouped.evening.push(slot);
      }
    });

    return grouped;
  };

  // Submitting the booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDateStr || !selectedSlot || !fullName || !email || !phone) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Formats the start_time and end_time as "HH:MM:SS"
      const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}:00`;
      };

      const payload = {
        full_name: fullName,
        email: email,
        phone: phone,
        service_id: selectedService.id,
        appointment_date: selectedDateStr,
        start_time: formatTime(selectedSlot.start),
        end_time: formatTime(selectedSlot.end),
        notes: notes || null
      };

      const appointment = await createAppointment(payload);
      setCreatedAppointment(appointment);
      setStep(4);
      if (onSuccess) {
        onSuccess(appointment);
      }
    } catch (err) {
      console.error('Error reserving appointment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDateStr) return '';
    const date = new Date(selectedDateStr + 'T00:00:00');
    return date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicators */}
      {step < 4 && (
        <div className="mb-10 px-4">
          <div className="flex items-center justify-between max-w-xl mx-auto relative">
            {/* Background progress track line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#EADCC9]/50 -translate-y-1/2 z-0" />
            
            {/* Active progress track fill line */}
            <div 
              className="absolute top-1/2 left-0 h-[2px] bg-[#C5A880] -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />

            {[
              { num: 1, label: 'Choose Service' },
              { num: 2, label: 'Select Date & Time' },
              { num: 3, label: 'Your Information' },
            ].map(s => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex flex-col items-center z-10 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2 ${
                    isCompleted 
                      ? 'bg-[#C5A880] border-[#C5A880] text-white' 
                      : isActive 
                        ? 'bg-[#3E3C3A] border-[#3E3C3A] text-white scale-110 shadow-md shadow-[#C5A880]/10' 
                        : 'bg-white border-[#EADCC9] text-[#8B7E74]'
                  }`}>
                    {isCompleted ? '✓' : s.num}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:inline ${isActive ? 'text-[#1F1E1D] font-bold' : 'text-[#8B7E74]'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold">Exquisite Offerings</span>
            <h3 className="font-serif-display text-3xl sm:text-4xl font-bold mt-1 text-[#3E3C3A]">Select a Salon Service</h3>
            <p className="text-[#8B7E74] max-w-md mx-auto mt-2 text-sm sm:text-base">
              Each experience is custom-tailored to enhance your unique structural elegance and confidence.
            </p>
          </div>

          {loadingServices ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin" />
              <p className="text-sm text-[#8B7E74]">Curating our premium rituals...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {services.map(service => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`border p-6 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-[#C5A880] bg-[#FAF8F5] ring-1 ring-[#C5A880]/30 shadow-md' 
                        : 'border-[#EADCC9]/50 bg-white hover:border-[#C5A880]/60 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="font-serif-display text-xl font-bold text-[#3E3C3A] group-hover:text-[#C5A880] transition-colors">
                          {service.name}
                        </h4>
                        <span className="text-lg font-bold text-[#C5A880] whitespace-nowrap">
                          ${service.price}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#8B7E74] leading-relaxed mb-6">
                        {service.description || 'Custom professional service tailored specifically to your stylist recommendation.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#EADCC9]/30 pt-4 mt-auto">
                      <span className="text-xs font-semibold text-[#8B7E74] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                        {service.duration_minutes} Minutes
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          setStep(2);
                        }}
                        className={`text-xs font-semibold py-1.5 px-4 rounded-full transition-all duration-300 flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#3E3C3A] text-white hover:bg-[#1F1E1D]'
                            : 'bg-[#F4EFE6] text-[#3E3C3A] hover:bg-[#C5A880] hover:text-white'
                        }`}
                      >
                        <span>Select Ritual</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedService && (
            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#3E3C3A] text-white hover:bg-[#1F1E1D] transition-all font-semibold shadow-sm cursor-pointer hover:shadow-md hover:translate-x-0.5"
              >
                <span>Continue to Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div>
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold">Reserve Your Spot</span>
            <h3 className="font-serif-display text-3xl sm:text-4xl font-bold mt-1 text-[#3E3C3A]">Choose Date & Time</h3>
            <p className="text-[#8B7E74] max-w-md mx-auto mt-2 text-sm">
              Selected service: <span className="text-[#3E3C3A] font-semibold">{selectedService?.name}</span> ({selectedService?.duration_minutes} min)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Calendar Column */}
            <div className="lg:col-span-7">
              <h4 className="text-xs uppercase tracking-widest text-[#8B7E74] font-semibold mb-3 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#C5A880]" />
                <span>1. Select an Open Date</span>
              </h4>
              {renderCalendar()}
            </div>

            {/* Time Slots Column */}
            <div className="lg:col-span-5">
              <h4 className="text-xs uppercase tracking-widest text-[#8B7E74] font-semibold mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C5A880]" />
                <span>2. Available Time Slots</span>
              </h4>

              {!selectedDateStr ? (
                <div className="border border-dashed border-[#EADCC9] rounded-xl p-8 text-center bg-white text-[#8B7E74]">
                  <CalendarDays className="w-10 h-10 text-[#C5A880]/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-[#3E3C3A]">Awaiting Date Selection</p>
                  <p className="text-xs text-[#8B7E74] mt-1">Please select an open date on the calendar first to calculate live available time slots.</p>
                </div>
              ) : loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 bg-white border border-[#EADCC9]/50 rounded-xl">
                  <div className="w-8 h-8 border-3 border-[#C5A880]/20 border-t-[#C5A880] rounded-full animate-spin" />
                  <p className="text-xs text-[#8B7E74]">Reviewing live stylist schedules...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="border border-[#EADCC9]/50 rounded-xl p-8 text-center bg-white text-[#8B7E74]">
                  <HelpCircle className="w-10 h-10 text-amber-500/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#3E3C3A]">No Slots Available</p>
                  <p className="text-xs text-[#8B7E74] mt-1">There are no remaining booking windows on this day. Please try a different date or weekday.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[390px] overflow-y-auto pr-1">
                  {/* Part of Day Groups */}
                  {Object.entries(getGroupedSlots()).map(([timeOfDay, slots]) => {
                    if (slots.length === 0) return null;
                    return (
                      <div key={timeOfDay} className="bg-white border border-[#EADCC9]/40 rounded-lg p-3">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#C5A880] mb-2 block">
                          {timeOfDay} Slots
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map(slot => {
                            const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
                            return (
                              <button
                                key={slot.start.getTime()}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-1 text-center rounded-md font-medium text-xs transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#C5A880] border-[#C5A880] text-white shadow-sm'
                                    : 'bg-[#FAF8F5] border-[#FAF8F5] text-[#3E3C3A] hover:border-[#C5A880] hover:bg-[#F3ECE0]'
                                }`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between mt-10 border-t border-[#EADCC9]/40 pt-6">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#EADCC9] text-[#3E3C3A] hover:bg-[#F4EFE6] transition-all font-medium text-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm cursor-pointer ${
                selectedSlot
                  ? 'bg-[#3E3C3A] text-white hover:bg-[#1F1E1D] hover:shadow-md'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <span>Confirm Reservation Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Enter Details */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold">Your Information</span>
            <h3 className="font-serif-display text-3xl sm:text-4xl font-bold mt-1 text-[#3E3C3A]">Complete Reservation</h3>
            <p className="text-[#8B7E74] max-w-md mx-auto mt-2 text-sm">
              Provide your details below to finalize your booking at AURA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Form Details Column */}
            <form onSubmit={handleBookingSubmit} className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A880]" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white border border-[#EADCC9] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 transition-all text-[#1F1E1D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A880]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-[#EADCC9] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 transition-all text-[#1F1E1D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A880]" />
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-white border border-[#EADCC9] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 transition-all text-[#1F1E1D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1.5" htmlFor="notes">
                  Styling Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C5A880]" />
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us about your hair type, desired look, or styling preferences..."
                    className="w-full bg-white border border-[#EADCC9] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 transition-all text-[#1F1E1D]"
                  />
                </div>
              </div>

              {/* Navigation Actions inside form */}
              <div className="flex justify-between mt-8 border-t border-[#EADCC9]/40 pt-5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#EADCC9] text-[#3E3C3A] hover:bg-[#F4EFE6] transition-all font-medium text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#3E3C3A] hover:bg-[#1F1E1D] text-white font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Reserving...</span>
                    </>
                  ) : (
                    <>
                      <span>Book Appointment</span>
                      <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Summary Column */}
            <div className="md:col-span-5 bg-[#FAF8F5] border border-[#EADCC9] rounded-xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#C5A880] block pb-2 border-b border-[#EADCC9]/50">
                Reservation Summary
              </span>
              
              <div>
                <p className="text-xs text-[#8B7E74] font-medium">Selected Service</p>
                <p className="text-sm font-semibold text-[#3E3C3A] mt-0.5">{selectedService?.name}</p>
                <p className="text-xs text-[#C5A880] font-medium">{selectedService?.duration_minutes} min • ${selectedService?.price}</p>
              </div>

              <div>
                <p className="text-xs text-[#8B7E74] font-medium">Appointment Date</p>
                <p className="text-sm font-semibold text-[#3E3C3A] mt-0.5">{formatSelectedDate()}</p>
              </div>

              <div>
                <p className="text-xs text-[#8B7E74] font-medium">Selected Time Window</p>
                <p className="text-sm font-semibold text-[#3E3C3A] mt-0.5">{selectedSlot?.label}</p>
                <p className="text-[10px] text-[#8B7E74] mt-0.5">Please arrive 5 minutes early for consultation.</p>
              </div>

              <div className="border-t border-[#EADCC9]/50 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-[#3E3C3A]">Estimated Total</span>
                <span className="font-bold text-lg text-[#C5A880]">${selectedService?.price}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Success confirmation screen */}
      {step === 4 && createdAppointment && (
        <div className="max-w-2xl mx-auto bg-white border border-[#EADCC9] rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className="bg-[#3E3C3A] text-white p-8 text-center relative">
            <div className="absolute top-0 right-0 p-3 opacity-15">
              <Sparkles className="w-24 h-24 text-[#C5A880]" />
            </div>
            
            <div className="w-16 h-16 bg-[#C5A880] text-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-[#3E3C3A] shadow-md animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif-display text-3xl font-bold">Appointment Reserved</h3>
            <p className="text-[#EADCC9] text-sm mt-1">We look forward to curating your look.</p>
            <span className="inline-block mt-3 px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono tracking-wider uppercase">
              Ref ID: #{createdAppointment.id.substring(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Details */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#EADCC9]/40">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8B7E74] font-bold">Client</span>
                <p className="text-base font-bold text-[#1F1E1D] mt-0.5">{createdAppointment.full_name}</p>
                <p className="text-xs text-[#8B7E74]">{createdAppointment.email}</p>
                <p className="text-xs text-[#8B7E74]">{createdAppointment.phone}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8B7E74] font-bold">Service Ritual</span>
                <p className="text-base font-bold text-[#C5A880] mt-0.5">{createdAppointment.service?.name}</p>
                <p className="text-xs text-[#8B7E74]">{createdAppointment.service?.duration_minutes} mins duration</p>
                <p className="text-xs font-bold text-[#3E3C3A]">${createdAppointment.service?.price}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#EADCC9]/40">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8B7E74] font-bold">Date & Time</span>
                <p className="text-base font-bold text-[#1F1E1D] mt-0.5">
                  {new Date(createdAppointment.appointment_date + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#8B7E74] mt-1">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>
                    {createdAppointment.start_time.substring(0, 5)} - {createdAppointment.end_time.substring(0, 5)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8B7E74] font-bold">Status</span>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Pending Confirmation
                  </span>
                </div>
                <p className="text-[10px] text-[#8B7E74] mt-1.5">A confirmation email & calendar link have been dispatched.</p>
              </div>
            </div>

            {createdAppointment.notes && (
              <div className="pb-6 border-b border-[#EADCC9]/40">
                <span className="text-[10px] uppercase tracking-widest text-[#8B7E74] font-bold">Client Notes</span>
                <p className="text-xs text-[#3E3C3A] italic mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#EADCC9]/40">
                  "{createdAppointment.notes}"
                </p>
              </div>
            )}

            {/* Directions / Guidelines */}
            <div className="flex gap-3 bg-[#FAF8F5] p-4 rounded-xl border border-[#EADCC9]/50">
              <MapPin className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#3E3C3A] uppercase tracking-wider">AURA Salon Guidelines</p>
                <p className="text-xs text-[#8B7E74] mt-1 leading-relaxed">
                  We are located at <span className="font-semibold text-[#1F1E1D]">420 N. Beverly Drive, Beverly Hills, CA 90210</span>. Valet parking is available at the front entrance. If you need to cancel or modify your appointment, please contact us at least 24 hours in advance.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 print:hidden">
              <button
                onClick={() => {
                  // Reset State
                  setStep(1);
                  setSelectedService(null);
                  setSelectedDateStr('');
                  setSelectedSlot(null);
                  setFullName('');
                  setEmail('');
                  setPhone('');
                  setNotes('');
                  setCreatedAppointment(null);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-[#EADCC9] text-xs font-bold text-[#3E3C3A] hover:bg-[#F4EFE6] transition-all cursor-pointer"
              >
                <span>Book Another Appointment</span>
              </button>

              <button
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#3E3C3A] text-white hover:bg-[#1F1E1D] text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
