'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import type { AvailabilitySlot, Court } from '@/types/database';
import {
  Trophy,
  Clock,
  QrCode,
  Flame,
  Check,
  AlertCircle,
  Loader2,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  UserCheck,
  CreditCard,
  Zap,
  Info,
  CalendarCheck,
  Sun,
  Sunset,
  Moon,
  ChevronRight
} from 'lucide-react';

interface DaySummary {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  status: 'available' | 'almost_full' | 'fully_booked' | 'past';
}

const DEFAULT_COURTS: Court[] = [
  {
    id: '80d4920a-34d9-47f3-8f1b-4627f5b289de',
    name: 'Court 1 - Indoor (Pro Cushion)',
    type: 'indoor',
    hourly_rate: 300,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '052becb1-e01d-4cd9-88ae-3d6e419259fd',
    name: 'Court 2 - Indoor (Tournament Spec)',
    type: 'indoor',
    hourly_rate: 300,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const DURATION_OPTIONS = [
  { hours: 1, label: '1 Hour', sub: 'Standard match / friendly dink' },
  { hours: 2, label: '2 Hours', sub: 'Popular • Best for 2v2 doubles' },
  { hours: 3, label: '3 Hours', sub: 'Tournament & mini-round-robin' },
  { hours: 4, label: '4 Hours', sub: 'Squad training & league blocks' },
];

export default function BookPage() {
  const [courts, setCourts] = useState<Court[]>(DEFAULT_COURTS);
  const [selectedCourt, setSelectedCourt] = useState<Court>(DEFAULT_COURTS[0]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [durationHours, setDurationHours] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  // Guest Contact Form
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paddleRental, setPaddleRental] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Availability & Density Heatmap State
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [monthOverview, setMonthOverview] = useState<Record<string, DaySummary>>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');

  // Fetch active courts and current user profile on mount
  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient();

      // Load user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) setGuestName(profile.full_name);
        if (user.email) setGuestEmail(user.email);
        if (profile?.phone) setGuestPhone(profile.phone);
      }

      // Load courts with resilient fallback
      const { data: dbCourts } = await supabase
        .from('courts')
        .select('*')
        .order('name', { ascending: true });

      if (dbCourts && dbCourts.length > 0) {
        const activeCourts = dbCourts
          .filter((c: any) => c.is_active !== false && c.status !== 'inactive')
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type || (c.name?.toLowerCase().includes('outdoor') ? 'outdoor' : 'indoor'),
            hourly_rate: c.hourly_rate !== undefined && c.hourly_rate !== null ? Number(c.hourly_rate) : 300,
            is_active: c.is_active !== false,
            created_at: c.created_at || new Date().toISOString(),
          }));

        if (activeCourts.length > 0) {
          setCourts(activeCourts);
          setSelectedCourt(activeCourts[0]);
        }
      }
    }

    loadInitialData();
  }, []);

  // Format date helper: YYYY-MM-DD
  const formatDateToYMD = (d?: Date) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const rawDateStr = formatDateToYMD(selectedDate);

  // Fetch live slot availability and month overview
  const fetchAvailability = useCallback(async () => {
    if (!rawDateStr || !selectedCourt?.id) return;

    setIsLoadingSlots(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/availability?courtId=${selectedCourt.id}&date=${rawDateStr}&durationHours=${durationHours}`
      );
      if (!res.ok) throw new Error('Could not fetch slot availability.');

      const data = await res.json();
      const loadedSlots: AvailabilitySlot[] = data.slots || [];
      setSlots(loadedSlots);

      if (data.monthOverview) {
        setMonthOverview((prev) => ({ ...prev, ...data.monthOverview }));
      }

      // Preserve or reset selected slot if still available
      setSelectedSlot((prev) => {
        if (!prev) return null;
        const stillAvailable = loadedSlots.find(
          (s) => s.hour24 === prev.hour24 && s.available
        );
        return stillAvailable || null;
      });
    } catch (err: unknown) {
      console.error('Failed to load availability:', err);
      setErrorMessage('Unable to connect to availability service. Please try again.');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [rawDateStr, selectedCourt?.id, durationHours]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Fetch month overview on month change
  const handleMonthChange = useCallback(
    async (newMonth: Date) => {
      setVisibleMonth(newMonth);
      if (!selectedCourt?.id) return;

      const yearNum = newMonth.getFullYear();
      const monthNum = String(newMonth.getMonth() + 1).padStart(2, '0');
      const monthStr = `${yearNum}-${monthNum}`;

      try {
        const res = await fetch(`/api/availability?courtId=${selectedCourt.id}&month=${monthStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.monthOverview) {
            setMonthOverview((prev) => ({ ...prev, ...data.monthOverview }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch month overview:', err);
      }
    },
    [selectedCourt?.id]
  );

  // Modifiers for instant calendar density markers
  const calendarModifiers = useMemo(() => {
    const almostFullDates: Date[] = [];
    const fullyBookedDates: Date[] = [];
    const availableDates: Date[] = [];

    Object.values(monthOverview).forEach((day) => {
      if (day.status === 'past') return;
      const [y, m, d] = day.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      if (day.status === 'almost_full') {
        almostFullDates.push(dateObj);
      } else if (day.status === 'fully_booked') {
        fullyBookedDates.push(dateObj);
      } else if (day.status === 'available') {
        availableDates.push(dateObj);
      }
    });

    return {
      almostFull: almostFullDates,
      fullyBooked: fullyBookedDates,
      available: availableDates,
    };
  }, [monthOverview]);

  // Current selected day summary
  const selectedDaySummary = rawDateStr ? monthOverview[rawDateStr] : null;

  // Filter slots by session time of day
  const filteredSlots = useMemo(() => {
    if (timeFilter === 'morning') return slots.filter(s => s.hour24 >= 6 && s.hour24 < 12);
    if (timeFilter === 'afternoon') return slots.filter(s => s.hour24 >= 12 && s.hour24 < 17);
    if (timeFilter === 'night') return slots.filter(s => s.hour24 >= 17 && s.hour24 <= 22);
    return slots;
  }, [slots, timeFilter]);

  // Price Calculation: court rate * duration + paddle addon
  const hourlyRate = selectedCourt.hourly_rate !== undefined && selectedCourt.hourly_rate !== null ? Number(selectedCourt.hourly_rate) : 300;
  const courtBasePrice = hourlyRate * durationHours;
  const paddlePrice = paddleRental ? 150 : 0;
  const totalAmount = courtBasePrice + paddlePrice;

  // Handle Checkout submission (Strict Pay-First via PayMongo)
  const handleInitiateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMessage('Please select an available time slot from the schedule.');
      return;
    }
    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage('Please enter your full name and email for your booking receipt.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout/paymongo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedCourt.id,
          date: rawDateStr,
          timeSlot: selectedSlot.time,
          hour24: selectedSlot.hour24,
          durationHours,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim() || undefined,
          paddleRental,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize PayMongo checkout.');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Checkout session URL was not returned.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date helper: "Friday, Aug 29"
  const formattedDisplayDate = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'No Date Selected';

  const jumpToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    setVisibleMonth(today);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-12 space-y-8 font-sans bg-[#0f1218] text-slate-100 selection:bg-red-600 selection:text-white">
      
      {/* Top Banner & Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4ff00]/10 text-[#d4ff00] text-xs font-black border border-[#d4ff00]/30 shadow-sm">
          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
          <span>C&amp;J Pickleball Arena • ₱{hourlyRate.toFixed(2)}/hr Flat Rate • PayMongo Instant Lock</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Reserve an Indoor Court
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-3xl">
          Select your indoor court, choose single or multi-hour duration, and pick an available start
          time. Contiguous intervals are locked seamlessly via PayMongo (GCash, Maya, QR Ph, &amp; Cards).
        </p>
      </div>

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl border border-red-500/40 bg-red-950/40 flex items-start gap-3 text-sm text-red-300 shadow-xl animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold block text-red-200">Attention Required</strong>
            <p className="text-xs text-red-300/90">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (5 Cols): Court & Date & Duration Selection */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step 1: Select Court */}
          <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-black text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#d4ff00]" /> 1. Choose Court
                </span>
                <span className="text-xs font-black text-[#d4ff00] bg-[#d4ff00]/10 px-2.5 py-0.5 rounded-full border border-[#d4ff00]/30">
                  ₱{Number(selectedCourt.hourly_rate ?? 300).toFixed(2)}/hr
                </span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Both courts are official indoor tournament-grade cushioned surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {courts.map((court) => {
                const isSelected = selectedCourt.id === court.id;
                return (
                  <div
                    key={court.id}
                    onClick={() => setSelectedCourt(court)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'border-red-500 bg-gradient-to-r from-red-950/60 to-slate-900 shadow-lg shadow-red-500/20 scale-[1.01]'
                        : 'border-white/10 bg-[#0f1218] hover:border-white/20 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{court.name}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                          {court.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        8mm Poly Cushion • High-Lux 850 LED • Air Conditioned
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-[#d4ff00] text-lg">
                        ₱{Number(court.hourly_rate ?? 300).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-500 block">/ hour</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Step 2: Duration Selector */}
          <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-md rounded-3xl shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4ff00]" /> 2. Select Duration
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Contiguous slot locking reserves uninterrupted play time for your session.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-2.5">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = durationHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setDurationHours(opt.hours)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#d4ff00] bg-[#d4ff00]/15 text-white shadow-md shadow-[#d4ff00]/20'
                        : 'border-white/10 bg-[#0f1218] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-white">{opt.label}</span>
                      <span className="text-xs font-bold text-[#d4ff00]">
                        ₱{Number(hourlyRate * opt.hours).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{opt.sub}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Step 3: Date Picker with Live Availability Heatmap */}
          <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10">
            
            {/* Card Header & Quick Navigation */}
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#d4ff00]" /> 3. Pick Date
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  Live color indicators show real-time slot availability
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={jumpToToday}
                className="h-7 px-3 text-[11px] font-extrabold border-white/20 text-[#d4ff00] hover:bg-[#d4ff00]/10 hover:text-white rounded-xl"
              >
                Today
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              
              {/* Interactive Density Legend */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/40 border border-white/5 text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
                  <span>Almost Full 🔥</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-300">
                  <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                  <span>Sold Out</span>
                </div>
              </div>

              {/* The Standout Calendar Component */}
              <div className="p-2 rounded-2xl bg-[#0f1218]/90 border border-white/5 shadow-inner">
                <Calendar
                  mode="single"
                  month={visibleMonth}
                  onMonthChange={handleMonthChange}
                  selected={selectedDate}
                  modifiers={calendarModifiers}
                  onSelect={(newDate) => {
                    if (newDate) {
                      const cleanDate = new Date(newDate);
                      cleanDate.setHours(0, 0, 0, 0);
                      setSelectedDate(cleanDate);
                    }
                  }}
                  className="rounded-2xl w-full text-slate-100"
                  disabled={(d) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return d < today;
                  }}
                />
              </div>

              {/* Instant Selected Date Availability Badge */}
              {selectedDaySummary ? (
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    selectedDaySummary.status === 'almost_full'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                      : selectedDaySummary.status === 'fully_booked'
                      ? 'bg-red-950/40 border-red-500/40 text-red-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedDaySummary.status === 'almost_full' ? (
                      <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                    ) : selectedDaySummary.status === 'fully_booked' ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <strong className="block font-bold">
                        {selectedDaySummary.status === 'almost_full'
                          ? 'Filling Fast — Almost Fully Booked!'
                          : selectedDaySummary.status === 'fully_booked'
                          ? 'Sold Out for this Date'
                          : 'Plenty of Open Slots Available'}
                      </strong>
                      <span className="text-[11px] opacity-90">
                        {selectedDaySummary.status === 'almost_full'
                          ? `Only ${selectedDaySummary.availableSlots} of 16 slots remaining`
                          : selectedDaySummary.status === 'fully_booked'
                          ? 'All 16 operational hours reserved'
                          : `${selectedDaySummary.availableSlots} of 16 hours open`}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm px-2 py-1 rounded-xl bg-black/40 border border-white/10">
                    {selectedDaySummary.availableSlots} Left
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#d4ff00]" />
                  <span>Selected Date: <strong>{formattedDisplayDate}</strong></span>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Right Column (7 Cols): Live Schedule & Checkout Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 4: Time Slot Grid (6:00 AM - 10:00 PM) */}
          <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-md rounded-3xl shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d4ff00]" /> 4. Available Starting Slots
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs mt-0.5">
                    {formattedDisplayDate} • {selectedCourt.name} ({durationHours} hr session)
                  </CardDescription>
                </div>
                
                {/* Session Filter Pills */}
                <div className="flex items-center gap-1 bg-[#0f1218] p-1 rounded-xl border border-white/10 self-start sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setTimeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${timeFilter === 'all' ? 'bg-[#d4ff00] text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('morning')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${timeFilter === 'morning' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Sun className="w-3 h-3" /> AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('afternoon')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${timeFilter === 'afternoon' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Sunset className="w-3 h-3" /> PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('night')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${timeFilter === 'night' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Moon className="w-3 h-3" /> Night
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {isLoadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <span className="text-xs font-bold tracking-wide">Checking live court availability...</span>
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-bold">
                  No slots found for this filter. Try switching session time or date.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot?.hour24 === slot.hour24;
                    const isAvailable = slot.available;

                    return (
                      <button
                        key={slot.hour24}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-2xl text-xs font-black transition-all border flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white border-[#d4ff00] shadow-lg shadow-red-500/30 scale-[1.04] z-10'
                            : isAvailable
                            ? 'bg-[#0f1218] text-slate-200 border-white/10 hover:border-red-500/50 hover:bg-slate-900/80 hover:text-white'
                            : 'bg-slate-950/60 text-slate-600 border-white/5 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span className="font-extrabold text-sm">{slot.time}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected
                              ? 'text-white'
                              : isAvailable
                              ? 'text-emerald-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {isSelected ? 'Selected' : isAvailable ? 'Available' : 'Occupied'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlot && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>
                      Locked block: <strong>{selectedSlot.time}</strong> to{' '}
                      <strong>
                        {selectedSlot.hour24 + durationHours % 12 === 0
                          ? 12
                          : (selectedSlot.hour24 + durationHours) % 12}
                        :00 {selectedSlot.hour24 + durationHours >= 12 ? 'PM' : 'AM'}
                      </strong>{' '}
                      ({durationHours} hour{durationHours > 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="font-black text-white">₱{courtBasePrice}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 5: Player Info & Checkout Form */}
          <Card className="border-red-500/40 bg-gradient-to-br from-[#171b24] via-[#171b24] to-red-950/40 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-base font-black text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400" /> 5. Player Details &amp; Payment
                </span>
                {isAuthenticated && (
                  <span className="text-[11px] font-bold text-[#d4ff00] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Auto-filled from Profile
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleInitiateCheckout} className="space-y-5">
                
                {/* Guest / Player Contact Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="guestName" className="text-xs font-bold text-slate-300">
                      Full Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="guestName"
                      placeholder="e.g. Alex Santos"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="bg-slate-950 border-white/10 text-white rounded-xl focus-visible:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="guestEmail" className="text-xs font-bold text-slate-300">
                      Email Address (for Ticket/Receipt) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      placeholder="e.g. alex@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="bg-slate-950 border-white/10 text-white rounded-xl focus-visible:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestPhone" className="text-xs font-bold text-slate-300">
                    Contact Phone Number (Optional)
                  </Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    placeholder="e.g. 0917 123 4567"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="bg-slate-950 border-white/10 text-white rounded-xl focus-visible:ring-red-500"
                  />
                </div>

                {/* Add-on: Pro Paddle Rental */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#0f1218]">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-white block">Add C&amp;J Pro Paddle Rental</span>
                    <span className="text-xs text-slate-400">
                      Includes 2 × 16mm Raw Carbon Fiber Paddles + 3 × 40-hole tournament balls (+₱150)
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={paddleRental ? 'default' : 'outline'}
                    className={
                      paddleRental
                        ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white font-black rounded-xl'
                        : 'border-white/15 text-slate-300 rounded-xl'
                    }
                    onClick={() => setPaddleRental(!paddleRental)}
                  >
                    {paddleRental ? 'Added (+₱150)' : '+ Add ₱150'}
                  </Button>
                </div>

                {/* Payment Gateway Information Banner (Strict Pay-First Policy) */}
                <div className="p-4 rounded-2xl border border-[#d4ff00]/30 bg-[#d4ff00]/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#d4ff00] shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#d4ff00]">
                      PayMongo Secure Gateway • Pay-First Policy
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    To prevent unpaid slot blocking and guarantee court availability, all online reservations must be settled via PayMongo.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-blue-400">GCash</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-emerald-400">Maya</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-cyan-400">QR Ph</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-amber-300">Debit / Credit Card</span>
                  </div>
                </div>

                {/* Summary & Trigger */}
                <div className="border-t border-white/10 pt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-[#d4ff00]">
                        {selectedCourt.name} • {selectedSlot ? selectedSlot.time : 'No slot chosen'}
                      </div>
                      <div className="text-3xl font-black text-white">
                        ₱{totalAmount.toFixed(2)}
                        <span className="text-xs text-slate-400 font-semibold ml-2">Total Amount</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {formattedDisplayDate} • {durationHours} Hour{durationHours > 1 ? 's' : ''} Session
                      </p>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={!selectedSlot || isSubmitting}
                      className="w-full sm:w-auto h-12 px-8 font-black text-white shadow-xl rounded-xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 shadow-red-500/30"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Securing Slot...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" /> Pay with PayMongo (₱{totalAmount.toFixed(2)})
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center sm:text-left">
                    🔒 <strong>Instant Slot Lock:</strong> You will be redirected to PayMongo to complete your payment securely. Your reservation ticket and check-in QR code will be generated immediately after payment.
                  </p>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}