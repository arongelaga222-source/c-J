'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ArrowDown,
  CalendarCheck2
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
  { hours: 1, label: '1 Hour', sub: 'Single game / warmup' },
  { hours: 2, label: '2 Hours', sub: 'Most Popular • Doubles match' },
  { hours: 3, label: '3 Hours', sub: 'Mini tournament / squad play' },
  { hours: 4, label: '4 Hours', sub: 'Team training & league block' },
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

  // DOM Refs for seamless auto-scrolling
  const slotSectionRef = useRef<HTMLDivElement>(null);
  const checkoutSectionRef = useRef<HTMLDivElement>(null);

  // Fetch active courts and current user profile on mount
  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient();

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

  // Handle Date Selection with smooth transition to Step 2
  const handleDateSelect = (newDate?: Date) => {
    if (newDate) {
      const cleanDate = new Date(newDate);
      cleanDate.setHours(0, 0, 0, 0);
      setSelectedDate(cleanDate);
      setSelectedSlot(null);

      setTimeout(() => {
        slotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  // Handle Slot Selection with smooth transition to Step 3
  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setTimeout(() => {
      checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Handle Checkout submission (PayMongo Hosted Checkout)
  const handleInitiateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMessage('Please select an available starting time slot from Step 2.');
      slotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage('Please enter your full name and email for your booking pass & receipt.');
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
        weekday: 'long',
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

  const currentStep = selectedSlot ? 3 : selectedDate ? 2 : 1;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-12 space-y-10 font-sans bg-[#0f1218] text-slate-100 selection:bg-red-600 selection:text-white">
      
      {/* Top Banner & Header */}
      <div className="space-y-4 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4ff00]/10 text-[#d4ff00] text-xs font-black border border-[#d4ff00]/30 shadow-sm">
          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
          <span>C&amp;J Pickleball Arena • Fixed ₱300.00 / hr Flat Rate • Instant PayMongo Lock</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Reserve Your Court in <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-[#d4ff00]">3 Easy Steps</span>
        </h1>
        <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
          Follow our 3-step booking flow below: click a date on the calendar, choose your court &amp; open slot, and confirm your reservation with instant PayMongo checkout.
        </p>
      </div>

      {/* Interactive Step-by-Step Procedure Navigation Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 rounded-3xl bg-[#171b24]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
        
        {/* Step 1 Pill */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`p-3.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer border ${
            currentStep === 1
              ? 'bg-gradient-to-r from-red-600/30 via-red-500/20 to-transparent border-red-500 text-white shadow-lg'
              : 'border-white/5 bg-[#0f1218]/60 text-slate-300 hover:border-white/20'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
            selectedDate ? 'bg-[#d4ff00] text-slate-950 shadow-md' : 'bg-red-600 text-white'
          }`}>
            {selectedDate ? <Check className="w-5 h-5 stroke-[3]" /> : '1'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#d4ff00] block">Step 1</span>
            <span className="text-xs font-bold text-white block truncate">Select Date &amp; Court</span>
          </div>
        </div>

        {/* Step 2 Pill */}
        <div
          onClick={() => slotSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className={`p-3.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer border ${
            currentStep === 2
              ? 'bg-gradient-to-r from-amber-500/30 via-amber-500/20 to-transparent border-amber-400 text-white shadow-lg ring-1 ring-amber-400/40'
              : selectedSlot
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-white/5 bg-[#0f1218]/60 text-slate-400 hover:border-white/20'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
            selectedSlot ? 'bg-emerald-400 text-slate-950 shadow-md' : currentStep === 2 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>
            {selectedSlot ? <Check className="w-5 h-5 stroke-[3]" /> : '2'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-300 block">Step 2</span>
            <span className="text-xs font-bold text-white block truncate">
              {selectedSlot ? `Slot: ${selectedSlot.time}` : 'Choose Available Slot'}
            </span>
          </div>
        </div>

        {/* Step 3 Pill */}
        <div
          onClick={() => checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className={`p-3.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer border ${
            currentStep === 3
              ? 'bg-gradient-to-r from-emerald-500/30 via-emerald-500/20 to-transparent border-emerald-400 text-white shadow-lg ring-1 ring-emerald-400/40'
              : 'border-white/5 bg-[#0f1218]/60 text-slate-400 hover:border-white/20'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
            currentStep === 3 ? 'bg-emerald-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
          }`}>
            3
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">Step 3</span>
            <span className="text-xs font-bold text-white block truncate">Player Info &amp; PayMongo</span>
          </div>
        </div>
      </div>

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="p-4 rounded-3xl border border-red-500/50 bg-red-950/60 flex items-start gap-3 text-sm text-red-200 shadow-2xl animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold block text-red-100">Attention Required</strong>
            <p className="text-xs text-red-300">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: BIG CALENDAR & COURT SELECTOR */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        
        {/* Step 1 Title Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-500/30">
              1
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                Select Your Date &amp; Court
              </h2>
              <p className="text-xs text-slate-400">
                Click any day on the big calendar below to see live court availability.
              </p>
            </div>
          </div>

          {/* Quick Date Jump Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={jumpToToday}
              className="h-9 px-4 text-xs font-extrabold border-white/20 text-[#d4ff00] hover:bg-[#d4ff00]/15 hover:text-white rounded-xl backdrop-blur-md"
            >
              📅 Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={jumpToTomorrow}
              className="h-9 px-4 text-xs font-extrabold border-white/20 text-amber-300 hover:bg-amber-500/15 hover:text-white rounded-xl backdrop-blur-md"
            >
              ⚡ Tomorrow
            </Button>
          </div>
        </div>

        {/* Big Calendar & Court Choice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Big Featured Calendar Component (7 Columns) */}
          <div className="lg:col-span-7">
            <Card className="border-white/15 bg-[#171b24]/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10">
              <CardHeader className="pb-4 border-b border-white/5 bg-[#141822]/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-[#d4ff00]" />
                      Interactive Booking Calendar
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-xs mt-0.5">
                      Live status indicators show real-time slot density
                    </CardDescription>
                  </div>

                  {/* Calendar Heatmap Legend */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-black/50 border border-white/10 text-[11px] font-bold self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                      <span>Open Slots</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                      <span>Filling Fast 🔥</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                      <span>Sold Out</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-5">
                
                {/* Standout Big Calendar */}
                <div className="p-3 sm:p-5 rounded-3xl bg-[#0f1218]/95 border border-white/10 shadow-2xl">
                  <Calendar
                    mode="single"
                    month={visibleMonth}
                    onMonthChange={handleMonthChange}
                    selected={selectedDate}
                    modifiers={calendarModifiers}
                    onSelect={handleDateSelect}
                    className="rounded-2xl w-full text-slate-100"
                    disabled={(d) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return d < today;
                    }}
                  />
                </div>

                {/* Selected Date Summary Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#171b24] border border-[#d4ff00]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#d4ff00]/15 border border-[#d4ff00]/30 flex items-center justify-center text-[#d4ff00]">
                      <CalendarCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#d4ff00]">Active Selection</span>
                      <h4 className="text-sm sm:text-base font-black text-white">{formattedDisplayDate}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedDaySummary ? (
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {selectedDaySummary.availableSlots} of 16 Slots Open
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Ready to select slot</span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => slotSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-[#d4ff00] hover:bg-[#bce600] text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Slots</span>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Court Choice & Duration Settings (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Court Selection Card */}
            <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-xl rounded-3xl shadow-xl">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-base font-black text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#d4ff00]" /> Choose Indoor Court
                  </span>
                  <span className="text-xs font-black text-[#d4ff00] bg-[#d4ff00]/10 px-2.5 py-0.5 rounded-full border border-[#d4ff00]/30">
                    ₱{hourlyRate.toFixed(2)}/hr
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Select which court you want to play on in Quezon City.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {courts.map((court) => {
                  const isSelected = selectedCourt.id === court.id;
                  return (
                    <div
                      key={court.id}
                      onClick={() => {
                        setSelectedCourt(court);
                        setSelectedSlot(null);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'border-red-500 bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 shadow-xl shadow-red-500/20 ring-1 ring-red-500/50 scale-[1.01]'
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

            {/* Duration Selector Card */}
            <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-xl rounded-3xl shadow-xl">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-base font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#d4ff00]" /> Select Play Duration
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Reserves contiguous uninterrupted hours on your selected court.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 grid grid-cols-2 gap-2.5">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = durationHours === opt.hours;
                  return (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => {
                        setDurationHours(opt.hours);
                        setSelectedSlot(null);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#d4ff00] bg-[#d4ff00]/15 text-white shadow-lg shadow-[#d4ff00]/20 ring-1 ring-[#d4ff00]/40'
                          : 'border-white/10 bg-[#0f1218] text-slate-300 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white">{opt.label}</span>
                        <span className="text-xs font-black text-[#d4ff00]">
                          ₱{Number(hourlyRate * opt.hours).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{opt.sub}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Summary Preview Box */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Selected Court:</span>
                <span className="text-white font-black">{selectedCourt.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Date:</span>
                <span className="text-[#d4ff00] font-black">{formattedDisplayDate}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Session Length:</span>
                <span className="text-white font-black">{durationHours} Hour{durationHours > 1 ? 's' : ''} (₱{courtBasePrice})</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 2: AVAILABLE TIME SLOTS GRID */}
      {/* ========================================================================= */}
      <div ref={slotSectionRef} className="space-y-6 pt-6 scroll-mt-24">
        
        {/* Step 2 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/30">
              2
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                Available Time Slots
              </h2>
              <p className="text-xs text-slate-400">
                Operating Daily 6:00 AM – 10:00 PM • Showing availability for {selectedCourt.name}
              </p>
            </div>
          </div>

          {/* Session Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-[#171b24] p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-[#d4ff00] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All (16 hrs)
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('morning')}
              className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                timeFilter === 'morning'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Morning (6AM-12PM)
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('afternoon')}
              className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                timeFilter === 'afternoon'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" /> Afternoon (12PM-5PM)
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('night')}
              className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                timeFilter === 'night'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Prime Night (5PM-10PM)
            </button>
          </div>
        </div>

        {/* Slot Grid Container */}
        <Card className="border-white/15 bg-[#171b24]/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10">
          <CardHeader className="pb-3 border-b border-white/5 bg-[#141822]/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4ff00]" />
                <span className="font-bold text-sm text-white">
                  {formattedDisplayDate} • {selectedCourt.name}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Reserving <strong className="text-white">{durationHours} contiguous hour{durationHours > 1 ? 's' : ''}</strong>
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {isLoadingSlots ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-9 h-9 animate-spin text-red-500" />
                <span className="text-sm font-bold tracking-wide">Loading real-time court availability...</span>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-bold">
                No slots match this filter. Try selecting &quot;All&quot; or picking another date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
                {filteredSlots.map((slot) => {
                  const isSelected = selectedSlot?.hour24 === slot.hour24;
                  const isAvailable = slot.available;

                  return (
                    <button
                      key={slot.hour24}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-4 rounded-2xl text-xs font-black transition-all border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white border-[#d4ff00] shadow-xl shadow-red-500/40 scale-[1.04] ring-2 ring-[#d4ff00] z-10'
                          : isAvailable
                          ? 'bg-[#0f1218] text-slate-100 border-white/10 hover:border-[#d4ff00] hover:bg-slate-900/90 hover:scale-[1.02] shadow-sm'
                          : 'bg-slate-950/70 text-slate-600 border-white/5 cursor-not-allowed opacity-40'
                      }`}
                    >
                      <span className="font-black text-base md:text-lg">{slot.time}</span>
                      
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white text-slate-950'
                            : isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-900 text-slate-600 border border-white/5'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : isAvailable ? 'Open Slot' : 'Occupied'}
                      </span>

                      {isAvailable && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          ₱{courtBasePrice} ({durationHours} hr{durationHours > 1 ? 's' : ''})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Slot Highlight Bar */}
            {selectedSlot && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 text-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="block font-black text-white text-sm">
                      Starting at {selectedSlot.time} on {formattedDisplayDate}
                    </strong>
                    <span className="text-slate-300">
                      Court locked from {selectedSlot.time} to{' '}
                      {selectedSlot.hour24 + durationHours % 12 === 0
                        ? 12
                        : (selectedSlot.hour24 + durationHours) % 12}
                      :00 {selectedSlot.hour24 + durationHours >= 12 ? 'PM' : 'AM'} ({durationHours} Hour{durationHours > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <span>Proceed to Step 3</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* STEP 3: PLAYER DETAILS & PAYMONGO PAYMENT */}
      {/* ========================================================================= */}
      <div ref={checkoutSectionRef} className="space-y-6 pt-6 scroll-mt-24">
        
        {/* Step 3 Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/30">
              3
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                Player Details &amp; Payment
              </h2>
              <p className="text-xs text-slate-400">
                Instant digital reservation ticket &amp; QR check-in pass issued immediately after payment.
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <span className="text-xs font-bold text-[#d4ff00] bg-[#d4ff00]/10 px-3 py-1 rounded-full border border-[#d4ff00]/30 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Auto-filled from Profile
            </span>
          )}
        </div>

        {/* Form and Summary Container */}
        <Card className="border-red-500/40 bg-gradient-to-br from-[#171b24] via-[#171b24] to-red-950/40 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
          <CardContent className="p-6 md:p-8 space-y-8">
            <form onSubmit={handleInitiateCheckout} className="space-y-6">
              
              {/* Contact Information Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                  Guest Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName" className="text-xs font-bold text-slate-200">
                      Full Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="guestName"
                      placeholder="e.g. Alex Santos"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="h-11 bg-slate-950 border-white/15 text-white rounded-xl focus-visible:ring-red-500 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guestEmail" className="text-xs font-bold text-slate-200">
                      Email Address (for QR Pass &amp; Receipt) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      placeholder="e.g. alex@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      className="h-11 bg-slate-950 border-white/15 text-white rounded-xl focus-visible:ring-red-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestPhone" className="text-xs font-bold text-slate-200">
                    Contact Phone Number (Optional)
                  </Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    placeholder="e.g. 0917 123 4567"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="h-11 bg-slate-950 border-white/15 text-white rounded-xl focus-visible:ring-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Add-on: Pro Paddle Rental */}
              <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#0f1218] gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-white">Add C&amp;J Pro Paddle Rental</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      +₱150.00
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Includes 2 × 16mm Raw Carbon Fiber Paddles + 3 × 40-hole tournament balls for your session.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={paddleRental ? 'default' : 'outline'}
                  className={
                    paddleRental
                      ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white font-black rounded-xl shrink-0'
                      : 'border-white/20 text-slate-300 rounded-xl shrink-0 hover:bg-white/10'
                  }
                  onClick={() => setPaddleRental(!paddleRental)}
                >
                  {paddleRental ? '✓ Added (+₱150)' : '+ Add ₱150'}
                </Button>
              </div>

              {/* PayMongo Payment Badge */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[#d4ff00]/30 bg-[#d4ff00]/10 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#d4ff00] shrink-0" />
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#d4ff00]">
                      PayMongo Secure Gateway • Instant Confirmation
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">Zero Hidden Booking Fees</span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  To prevent slot blocking and guarantee court time, reservations are locked automatically via PayMongo.
                </p>

                <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold text-slate-200">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" /> GCash
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Maya
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" /> QR Ph
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-amber-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Visa / Mastercard / Debit
                  </span>
                </div>
              </div>

              {/* Final Summary & Checkout CTA */}
              <div className="border-t border-white/10 pt-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-black/60 border border-white/10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#d4ff00]">Final Reservation Summary</span>
                    <h4 className="text-base sm:text-lg font-black text-white">
                      {selectedCourt.name}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {formattedDisplayDate} • {selectedSlot ? selectedSlot.time : 'No slot chosen'} ({durationHours} Hour{durationHours > 1 ? 's' : ''})
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-3xl font-black text-white">
                      ₱{totalAmount.toFixed(2)}
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">Total PHP Amount</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>256-Bit SSL Encrypted • Instant QR Check-in Pass</span>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={!selectedSlot || isSubmitting}
                    className="w-full sm:w-auto h-13 px-9 text-base font-black text-white shadow-2xl rounded-2xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 shadow-red-500/40 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Securing Your Court...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" /> Pay with PayMongo (₱{totalAmount.toFixed(2)})
                      </>
                    )}
                  </Button>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}