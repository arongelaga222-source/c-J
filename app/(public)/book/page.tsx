'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
  Sun,
  Sunset,
  Moon,
  CalendarCheck2,
  ChevronDown,
  Lock,
  ArrowRight,
  UserPlus
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

// Dropdown options up to 12 Hours
const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 1;
  return {
    hours: h,
    label: `${h} Hour${h > 1 ? 's' : ''}`,
    description:
      h === 1
        ? 'Single match / warm-up'
        : h === 2
        ? 'Doubles standard match'
        : h <= 4
        ? 'Squad tournament block'
        : h <= 8
        ? 'Half-day private tournament'
        : 'Full-day arena block',
  };
});

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

  // Registered Member Form
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paddleRental, setPaddleRental] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Availability & Density Heatmap State
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [monthOverview, setMonthOverview] = useState<Record<string, DaySummary>>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');

  // Fetch initial profile & courts
  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient();

      try {
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
          else if (user.user_metadata?.full_name) setGuestName(user.user_metadata.full_name);
          if (user.email) setGuestEmail(user.email);
          if (profile?.phone) setGuestPhone(profile.phone);
        } else {
          setIsAuthenticated(false);
        }
      } catch (authErr) {
        console.warn('Auth check error:', authErr);
        setIsAuthenticated(false);
      } finally {
        setIsAuthLoading(false);
      }

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

  const formatDateToYMD = (d?: Date) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const rawDateStr = formatDateToYMD(selectedDate);

  // Fetch live slot availability
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

  // Calendar density markers
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

  const selectedDaySummary = rawDateStr ? monthOverview[rawDateStr] : null;

  // Filter slots by session time
  const filteredSlots = useMemo(() => {
    if (timeFilter === 'morning') return slots.filter((s) => s.hour24 >= 6 && s.hour24 < 12);
    if (timeFilter === 'afternoon') return slots.filter((s) => s.hour24 >= 12 && s.hour24 < 17);
    if (timeFilter === 'night') return slots.filter((s) => s.hour24 >= 17 && s.hour24 <= 22);
    return slots;
  }, [slots, timeFilter]);

  // Price Calculation
  const hourlyRate =
    selectedCourt.hourly_rate !== undefined && selectedCourt.hourly_rate !== null
      ? Number(selectedCourt.hourly_rate)
      : 300;
  const courtBasePrice = hourlyRate * durationHours;
  const paddlePrice = paddleRental ? 150 : 0;
  const totalAmount = courtBasePrice + paddlePrice;

  // Handle Date Selection
  const handleDateSelect = (newDate?: Date) => {
    if (newDate) {
      const cleanDate = new Date(newDate);
      cleanDate.setHours(0, 0, 0, 0);
      setSelectedDate(cleanDate);
      setSelectedSlot(null);
    }
  };

  // Handle Checkout submission
  const handleInitiateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent('/book')}`;
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please pick an available time slot from the schedule below.');
      return;
    }
    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage('Your account name or email is missing. Please update your profile before booking.');
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

  const formattedDisplayDate = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No Date Selected';

  const jumpToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    setVisibleMonth(today);
    setSelectedSlot(null);
  };

  const jumpToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setSelectedDate(tomorrow);
    setVisibleMonth(tomorrow);
    setSelectedSlot(null);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 md:py-8 space-y-6 font-sans bg-[#0f1218] text-slate-100 selection:bg-red-600 selection:text-white">
      
      {/* Compact Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#171b24]/90 border border-white/10 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4ff00]/15 text-[#d4ff00] text-xs font-black border border-[#d4ff00]/30">
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>₱300 / hr Flat Rate</span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
            C&amp;J Court Reservation &amp; Instant Checkout
          </h1>
        </div>

        {/* 3 Steps Progress In-Line Badge */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className={`px-2.5 py-1 rounded-lg border ${selectedDate ? 'bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/40' : 'bg-slate-900 border-white/10'}`}>
            1. Date &amp; Court
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-2.5 py-1 rounded-lg border ${selectedSlot ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 border-white/10'}`}>
            2. Time Slot
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-2.5 py-1 rounded-lg border ${selectedSlot ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 border-white/10'}`}>
            3. PayMongo Lock
          </span>
        </div>
      </div>

      {/* Account Required Notice for Unauthenticated Users */}
      {!isAuthLoading && !isAuthenticated && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-3 text-amber-200">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block font-black text-xs uppercase tracking-wide">
                Account Required to Reserve
              </strong>
              <span className="text-slate-300 text-xs">
                Guest checkout is disabled. Please sign in or create an account to book your court schedule.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login?next=/book">
              <Button size="sm" className="h-8 px-3.5 text-xs font-black bg-gradient-to-r from-red-600 to-amber-500 text-white rounded-xl shadow-md hover:scale-105 transition-all">
                Sign In
              </Button>
            </Link>
            <Link href="/signup?next=/book">
              <Button size="sm" variant="outline" className="h-8 px-3.5 text-xs font-bold border-white/20 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl border border-red-500/50 bg-red-950/60 flex items-center justify-between text-xs text-red-200 shadow-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold px-2">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED ZERO-SCROLL BOOKING WORKSPACE (SPLIT VIEW) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (7 Cols): Big Calendar + Court Selector + Time Slots */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Top Control Bar: Court Tabs & Duration Dropdown (Up to 12 Hours) */}
          <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-md rounded-2xl p-3.5 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              
              {/* Court Switcher (7 Cols) */}
              <div className="sm:col-span-7 space-y-1.5">
                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-[#d4ff00]" /> 1. Select Court
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {courts.map((court) => {
                    const isSelected = selectedCourt.id === court.id;
                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourt(court);
                          setSelectedSlot(null);
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-red-600/30 to-amber-500/20 border-red-500 text-white shadow-md ring-1 ring-red-500/50'
                            : 'bg-[#0f1218] border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <span className="font-bold text-xs block truncate text-white">{court.name.split(' - ')[0]}</span>
                        <span className="text-[10px] text-[#d4ff00] font-black">₱{hourlyRate}/hr • Indoor</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Dropdown: 1 to 12 Hours (5 Cols) */}
              <div className="sm:col-span-5 space-y-1.5">
                <Label htmlFor="durationSelect" className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#d4ff00]" /> Rent Duration
                </Label>
                <div className="relative">
                  <select
                    id="durationSelect"
                    value={durationHours}
                    onChange={(e) => {
                      setDurationHours(Number(e.target.value));
                      setSelectedSlot(null);
                    }}
                    className="w-full h-10 px-3 pr-8 rounded-xl bg-[#0f1218] border border-white/15 text-white font-black text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-[#d4ff00] cursor-pointer shadow-inner"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.hours} value={opt.hours} className="bg-[#0f1218] text-white">
                        {opt.label} — ₱{(hourlyRate * opt.hours).toLocaleString()} ({opt.description})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

            </div>
          </Card>

          {/* Big Interactive Calendar Card */}
          <Card className="border-white/15 bg-[#171b24]/95 backdrop-blur-2xl rounded-3xl shadow-xl overflow-hidden ring-1 ring-white/10">
            <CardHeader className="py-2.5 px-4 border-b border-white/5 bg-[#141822]/80 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#d4ff00]" />
                <CardTitle className="text-sm font-black text-white">Interactive Date Selector</CardTitle>
              </div>

              {/* Quick Jump Buttons & Heatmap Legend */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold mr-2">
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Open
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Fast 🔥
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={jumpToToday}
                  className="h-7 px-2.5 text-[11px] font-extrabold border-white/20 text-[#d4ff00] hover:bg-[#d4ff00]/15 rounded-lg"
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={jumpToTomorrow}
                  className="h-7 px-2.5 text-[11px] font-extrabold border-white/20 text-amber-300 hover:bg-amber-500/15 rounded-lg"
                >
                  Tomorrow
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4">
              <div className="p-2 sm:p-3 rounded-2xl bg-[#0f1218]/95 border border-white/10 shadow-inner">
                <Calendar
                  mode="single"
                  month={visibleMonth}
                  onMonthChange={handleMonthChange}
                  selected={selectedDate}
                  modifiers={calendarModifiers}
                  onSelect={handleDateSelect}
                  className="rounded-xl w-full text-slate-100"
                  disabled={(d) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return d < today;
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Slot Availability Grid */}
          <Card className="border-white/15 bg-[#171b24]/95 backdrop-blur-2xl rounded-3xl shadow-xl overflow-hidden ring-1 ring-white/10">
            <CardHeader className="py-2.5 px-4 border-b border-white/5 bg-[#141822]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4ff00]" />
                <CardTitle className="text-sm font-black text-white">
                  2. Choose Starting Slot ({formattedDisplayDate})
                </CardTitle>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-[#0f1218] p-1 rounded-xl border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                    timeFilter === 'all' ? 'bg-[#d4ff00] text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('morning')}
                  className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                    timeFilter === 'morning' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3 h-3" /> AM
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('afternoon')}
                  className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                    timeFilter === 'afternoon' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sunset className="w-3 h-3" /> PM
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('night')}
                  className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                    timeFilter === 'night' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3 h-3" /> Night
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {isLoadingSlots ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  <span className="text-xs font-bold">Checking availability...</span>
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  No slots match filter. Switch session filter or date.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot?.hour24 === slot.hour24;
                    const isAvailable = slot.available;

                    return (
                      <button
                        key={slot.hour24}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white border-[#d4ff00] shadow-md shadow-red-500/30 scale-[1.03] ring-1 ring-[#d4ff00] z-10'
                            : isAvailable
                            ? 'bg-[#0f1218] text-slate-100 border-white/10 hover:border-[#d4ff00] hover:bg-slate-900'
                            : 'bg-slate-950/70 text-slate-600 border-white/5 cursor-not-allowed opacity-35'
                        }`}
                      >
                        <span className="font-black text-sm">{slot.time}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-white text-slate-950'
                              : isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {isSelected ? '✓ Picked' : isAvailable ? 'Open' : 'Full'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN (5 Cols): STICKY LIVE SUMMARY & INSTANT CHECKOUT */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          
          <Card className="border-red-500/40 bg-gradient-to-br from-[#171b24] via-[#171b24] to-red-950/40 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
            <CardHeader className="py-3 px-5 border-b border-white/5 bg-[#141822]/80 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm font-black text-white">3. Summary &amp; Instant Pay</CardTitle>
              </div>
              {!isAuthLoading && (
                isAuthenticated ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Member Account
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Account Required
                  </span>
                )
              )}
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              
              {/* Real-time Reservation Summary Ticket */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{selectedCourt.name}</span>
                  <span className="text-xs font-black text-[#d4ff00] bg-[#d4ff00]/10 px-2 py-0.5 rounded-md">
                    {durationHours} Hour{durationHours > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Date:</span>
                  <strong className="text-white">{formattedDisplayDate}</strong>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Time Slot:</span>
                  <strong className={selectedSlot ? 'text-emerald-400 font-black' : 'text-amber-400 font-bold'}>
                    {selectedSlot ? (
                      <>
                        {selectedSlot.time} –{' '}
                        {selectedSlot.hour24 + durationHours % 12 === 0
                          ? 12
                          : (selectedSlot.hour24 + durationHours) % 12}
                        :00 {selectedSlot.hour24 + durationHours >= 12 ? 'PM' : 'AM'}
                      </>
                    ) : (
                      '👈 Select time on left'
                    )}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-2 flex items-center justify-between text-sm">
                  <span className="text-xs text-slate-400">Total Price:</span>
                  <div className="text-right">
                    <span className="font-black text-xl text-white">₱{totalAmount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 block font-bold">(₱{courtBasePrice} court{paddleRental ? ' + ₱150 gear' : ''})</span>
                  </div>
                </div>
              </div>

              {/* Conditional: Loading vs Unauthenticated Gate vs Authenticated Checkout */}
              {isAuthLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  <span className="text-xs font-medium">Verifying member account...</span>
                </div>
              ) : !isAuthenticated ? (
                /* Account Required Gate (Guests cannot book) */
                <div className="p-4 rounded-2xl bg-[#0f1218] border border-amber-500/30 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                    <Lock className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white">Sign In Required to Book</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Guest reservations are disabled. Please sign in or create an account to reserve courts, obtain your digital QR pass, and manage cancellations.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Link href="/login?next=/book" className="block w-full">
                      <Button
                        type="button"
                        className="w-full h-11 text-xs font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Sign In to Book
                      </Button>
                    </Link>

                    <Link href="/signup?next=/book" className="block w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 text-xs font-bold border-white/20 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" /> Create Free Player Account
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Authenticated Member Checkout Form */
                <form onSubmit={handleInitiateCheckout} className="space-y-3.5">
                  {/* Verified Member Badge & Info Box */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Verified Member Account
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Linked Pass</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Player:</span>
                        <strong className="text-white font-bold">{guestName || 'Member Player'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-200 font-mono text-[11px]">{guestEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone Number (Optional for SMS/updates) */}
                  <div className="space-y-1">
                    <Label htmlFor="guestPhone" className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span>Phone Number</span>
                      <span className="text-[10px] text-slate-400 font-normal">For SMS / QR Pass</span>
                    </Label>
                    <Input
                      id="guestPhone"
                      type="tel"
                      placeholder="e.g. 0917 123 4567"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="h-9 bg-slate-950 border-white/15 text-white rounded-xl text-xs focus-visible:ring-red-500"
                    />
                  </div>

                  {/* Pro Paddle Rental Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#0f1218] gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-white block">Add Pro Paddle Rental (+₱150)</span>
                      <span className="text-[10px] text-slate-400 block">2 Carbon fiber paddles + 3 balls</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={paddleRental ? 'default' : 'outline'}
                      className={
                        paddleRental
                          ? 'h-7 px-2.5 text-xs bg-gradient-to-r from-red-500 to-amber-500 text-white font-black rounded-lg'
                          : 'h-7 px-2.5 text-xs border-white/20 text-slate-300 rounded-lg'
                      }
                      onClick={() => setPaddleRental(!paddleRental)}
                    >
                      {paddleRental ? '✓ Added' : '+ Add'}
                    </Button>
                  </div>

                  {/* PayMongo Badge */}
                  <div className="p-2.5 rounded-xl border border-[#d4ff00]/30 bg-[#d4ff00]/10 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-black text-[#d4ff00] text-[11px] uppercase tracking-wider">
                      <CreditCard className="w-3.5 h-3.5" /> PayMongo Secure Gateway
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px] font-black text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-blue-400">GCash</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-emerald-400">Maya</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-cyan-400">QR Ph</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-amber-300">Cards</span>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!selectedSlot || isSubmitting}
                    className="w-full h-12 text-sm font-black text-white shadow-xl rounded-xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 shadow-red-500/40 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Securing Court...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" /> Pay with PayMongo (₱{totalAmount.toFixed(2)})
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-slate-500 text-center">
                    🔒 Instant slot lock. Digital QR check-in pass sent to {guestEmail || 'your email'}.
                  </p>
                </form>
              )}

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}