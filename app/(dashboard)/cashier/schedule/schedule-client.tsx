'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { checkInBooking } from '@/app/actions';
import { Calendar } from '@/components/ui/calendar';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Trophy,
  Sparkles,
  Clock,
  CheckCircle2,
  Plus,
  Flame,
  Radio,
  Banknote,
  QrCode,
  Loader2,
  RefreshCw,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  MapPin,
  Check,
  Activity,
  Layers,
} from 'lucide-react';

export interface ScheduleBooking {
  id: string;
  court_id?: string;
  start_time: string;
  end_time: string;
  duration_hours?: number;
  total_price?: number;
  status: string;
  payment_method?: string;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
  notes?: string | null;
  expires_at?: string | null;
  profiles?: { full_name?: string | null } | null;
  courts?: { id?: string; name?: string } | null;
}

export interface ScheduleCourt {
  id: string;
  name: string;
  type?: string;
  hourly_rate?: number;
}

// C&J Court Operational Hours: 6:00 AM (6) to 10:00 PM (22) -> 16 intervals
const START_HOUR = 6;
const END_HOUR = 22;
const OPERATING_SLOTS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

export default function ScheduleClient({
  initialBookings,
  courts,
  initialDateStr,
}: {
  initialBookings: ScheduleBooking[];
  courts: ScheduleCourt[];
  initialDateStr: string;
}) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>(initialDateStr);
  const [bookings, setBookings] = useState<ScheduleBooking[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [monthOverview, setMonthOverview] = useState<
    Record<
      string,
      {
        totalSlots: number;
        bookedSlots: number;
        availableSlots: number;
        status: 'available' | 'almost_full' | 'fully_booked' | 'past';
      }
    >
  >({});

  // Realtime clock for live marker (updates every 30s)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch month occupancy for calendar
  useEffect(() => {
    const fetchMonthOccupancy = async () => {
      try {
        const monthStr = currentDate.slice(0, 7);
        const res = await fetch(`/api/availability?month=${monthStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.monthOverview) {
            setMonthOverview(data.monthOverview);
          }
        }
      } catch (err) {
        console.error('Failed to fetch month density:', err);
      }
    };
    fetchMonthOccupancy();
  }, [currentDate]);

  // Walk-in modal state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInCourtId, setWalkInCourtId] = useState(courts[0]?.id || '');
  const [walkInDate, setWalkInDate] = useState(initialDateStr);
  const [walkInHour, setWalkInHour] = useState(8);
  const [walkInDuration, setWalkInDuration] = useState(1);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<'cash' | 'counter_qr'>('cash');
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // Supabase Realtime Subscription for instantaneous schedule updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('schedule-bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookingsForDate(currentDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate]);

  // Fetch bookings for specific date with expired pending filter
  const fetchBookingsForDate = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const startOfDay = new Date(`${dateStr}T00:00:00.000+08:00`).toISOString();
      const endOfDay = new Date(`${dateStr}T23:59:59.999+08:00`).toISOString();
      const nowIso = new Date().toISOString();

      const { data } = await supabase
        .from('bookings')
        .select(`
          id,
          court_id,
          start_time,
          end_time,
          duration_hours,
          total_price,
          status,
          payment_method,
          guest_name,
          guest_phone,
          guest_email,
          notes,
          expires_at,
          profiles ( full_name ),
          courts ( id, name )
        `)
        .gte('end_time', startOfDay)
        .lte('start_time', endOfDay)
        .in('status', ['paid', 'checked_in', 'walk_in', 'pending_payment'])
        .order('start_time', { ascending: true });

      if (data) {
        const valid = (data as unknown as (ScheduleBooking & { expires_at?: string })[]).filter((b) => {
          if (b.status === 'pending_payment') {
            return b.expires_at ? b.expires_at > nowIso : false;
          }
          return ['paid', 'checked_in', 'walk_in'].includes(b.status);
        });

        const formatted = valid.map((b) => {
          const singleProfile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          const singleCourt = Array.isArray(b.courts) ? b.courts[0] : b.courts;
          return {
            ...b,
            guest_name:
              b.guest_name ||
              singleProfile?.full_name ||
              'Walk-in Guest',
            profiles: singleProfile || null,
            courts: singleCourt || null,
          };
        });

        setBookings(formatted);
      }
    } catch (err) {
      console.error('Failed to load schedule for date:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Date Selection Handlers
  const handleDateSelect = (dateStr: string) => {
    if (!dateStr) return;
    setCurrentDate(dateStr);
    const url = new URL(window.location.href);
    url.searchParams.set('date', dateStr);
    window.history.pushState({}, '', url.toString());
    fetchBookingsForDate(dateStr);
  };

  const handleOffsetDay = (offset: number) => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offset);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    handleDateSelect(`${yyyy}-${mm}-${dd}`);
  };

  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getTomorrowStr = () => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return `${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`;
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    startTransition(async () => {
      await checkInBooking(selectedBooking.id);
      setSelectedBooking(null);
      fetchBookingsForDate(currentDate);
    });
  };

  const openWalkInForSlot = (courtId: string, hour: number) => {
    setWalkInCourtId(courtId);
    setWalkInDate(currentDate);
    setWalkInHour(hour);
    setWalkInDuration(1);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInError(null);
    setIsWalkInOpen(true);
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInLoading(true);
    setWalkInError(null);

    try {
      const res = await fetch('/api/pos/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: walkInCourtId,
          date: walkInDate,
          hour24: walkInHour,
          durationHours: walkInDuration,
          guestName: walkInName.trim() || 'Walk-in Guest',
          guestPhone: walkInPhone.trim() || undefined,
          paymentMethod: walkInPaymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create walk-in booking.');

      setIsWalkInOpen(false);
      const playerDisplayName = walkInName.trim() || 'Walk-in Guest';
      setWalkInName('');
      setWalkInPhone('');
      
      setSuccessBanner(
        `✓ Walk-in booking confirmed for ${playerDisplayName} on ${walkInDate} (${formatHour(walkInHour)})!`
      );
      setTimeout(() => setSuccessBanner(null), 6000);

      // Auto-switch to the date where the walk-in was booked
      if (walkInDate !== currentDate) {
        handleDateSelect(walkInDate);
      } else {
        await fetchBookingsForDate(walkInDate);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setWalkInError(msg);
    } finally {
      setWalkInLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const getGridColumn = (startTime: string, endTime: string) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Convert UTC timestamp to local Philippine hours (UTC+8)
    const startHour = new Date(startDate.getTime() + 8 * 3600 * 1000).getUTCHours();
    const endHour = new Date(endDate.getTime() + 8 * 3600 * 1000).getUTCHours();

    const startCol = Math.max(startHour - START_HOUR + 1, 1);
    const endCol = Math.max(endHour - START_HOUR + 1, startCol + 1);
    return `${startCol} / ${endCol}`;
  };

  // Day Metrics
  const checkedInCount = useMemo(
    () => bookings.filter((b) => b.status === 'checked_in').length,
    [bookings]
  );
  const paidCount = useMemo(
    () => bookings.filter((b) => ['paid', 'walk_in'].includes(b.status)).length,
    [bookings]
  );
  const totalHoursBooked = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.duration_hours || 1), 0),
    [bookings]
  );

  const totalCapacityHours = courts.length * (END_HOUR - START_HOUR); // 2 courts * 16 hrs = 32
  const occupancyPercent = totalCapacityHours > 0
    ? Math.round((totalHoursBooked / totalCapacityHours) * 100)
    : 0;

  // Calendar density modifiers
  const calendarModifiers = useMemo(() => {
    const almostFullDates: Date[] = [];
    const fullyBookedDates: Date[] = [];
    const availableDates: Date[] = [];

    Object.entries(monthOverview).forEach(([dateKey, day]) => {
      if (day.status === 'past') return;
      const [y, m, d] = dateKey.split('-').map(Number);
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

  // Live Philippine Time Marker calculation
  const nowUtc = currentTime.getTime();
  const currentPhtDate = new Date(nowUtc + 8 * 3600 * 1000);
  const currentPhtHour = currentPhtDate.getUTCHours();
  const currentPhtMinute = currentPhtDate.getUTCMinutes();
  const isLiveOperating = currentPhtHour >= START_HOUR && currentPhtHour < END_HOUR;
  const liveMinuteOffset = (currentPhtHour - START_HOUR) * 60 + currentPhtMinute;
  const totalOperatingMinutes = (END_HOUR - START_HOUR) * 60; // 16 * 60 = 960
  const liveOffsetPercent = Math.min(
    100,
    Math.max(0, (liveMinuteOffset / totalOperatingMinutes) * 100)
  );

  const displayFormattedDate = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${currentDate}T00:00:00.000+08:00`));

  const isTodayActive = currentDate === getTodayStr();
  const isTomorrowActive = currentDate === getTomorrowStr();

  return (
    <div className="p-4 sm:p-6 h-[calc(100vh)] flex flex-col bg-[#0f1117] text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="mb-3 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Interactive Date Control Bar */}
      <div className="mb-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        
        {/* Left Title & Live Pulse */}
        <div>
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Daily Court Timeline
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
              <Radio className="w-3 h-3 animate-pulse" /> REALTIME LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Court 1 & Court 2 indoor schedule, walk-in lock, and player check-in counter.
          </p>
        </div>

        {/* Right Controls: Interactive Date Navigator + Search + Calendar Modal + Walk-In Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          
          {/* Quick Date Navigator */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-2xl p-1 shadow-lg backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOffsetDay(-1)}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Date Picker Input with formatted label */}
            <label className="relative flex items-center px-2 cursor-pointer group">
              <CalendarIcon className="h-4 w-4 text-amber-400 shrink-0 mr-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-amber-300 group-hover:text-white transition-colors">
                {new Intl.DateTimeFormat('en-PH', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(new Date(`${currentDate}T00:00:00.000+08:00`))}
              </span>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full [color-scheme:dark]"
              />
            </label>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOffsetDay(1)}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Date Jump Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => handleDateSelect(getTodayStr())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isTodayActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDateSelect(getTomorrowStr())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isTomorrowActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Month Occupancy Heatmap Calendar Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCalendarOpen(true)}
            className="border-white/10 bg-slate-900 text-slate-200 hover:text-white hover:bg-white/10 rounded-2xl h-10 px-3 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Inspect Month Occupancy Calendar"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Heatmap</span>
          </Button>

          {/* Player Search Bar */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-8 pr-3 bg-slate-900 border border-white/10 text-white rounded-2xl text-xs font-medium focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBookingsForDate(currentDate)}
            disabled={isLoading}
            className="border-white/10 bg-slate-900 text-slate-200 hover:text-white hover:bg-white/10 rounded-2xl h-10 px-3 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            {isLoading ? 'Syncing...' : 'Refresh'}
          </Button>

          {/* Quick Walk-in Modal Trigger */}
          <Dialog
            open={isWalkInOpen}
            onOpenChange={(open) => {
              if (open) {
                setWalkInDate(currentDate);
              }
              setIsWalkInOpen(open);
            }}
          >
            <DialogTrigger className="inline-flex items-center justify-center rounded-2xl text-xs font-black transition-all bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/25 h-10 px-4 py-2 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-1.5" /> + Quick Walk-in Booking
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#161922] border-white/15 text-slate-100 rounded-3xl shadow-2xl">
              <form onSubmit={handleCreateWalkIn}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" /> Walk-In Court Booking
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Immediately reserve a court slot and record offline cash or counter QR tender.
                  </DialogDescription>
                </DialogHeader>

                {walkInError && (
                  <div className="p-3 my-2 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                    {walkInError}
                  </div>
                )}

                <div className="space-y-4 py-4">
                  {/* Select Date */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-300">Reservation Date</Label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setWalkInDate(getTodayStr())}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            walkInDate === getTodayStr()
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'text-slate-400 hover:text-white bg-slate-950'
                          }`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalkInDate(getTomorrowStr())}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            walkInDate === getTomorrowStr()
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'text-slate-400 hover:text-white bg-slate-950'
                          }`}
                        >
                          Tomorrow
                        </button>
                      </div>
                    </div>
                    <Input
                      type="date"
                      value={walkInDate}
                      onChange={(e) => setWalkInDate(e.target.value)}
                      required
                      className="bg-slate-950 border-white/10 text-white rounded-xl [color-scheme:dark]"
                    />
                  </div>

                  {/* Select Court */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Select Court</Label>
                    <select
                      value={walkInCourtId}
                      onChange={(e) => setWalkInCourtId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-red-500"
                    >
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (₱{Number(c.hourly_rate ?? 1).toFixed(2)}/hr)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Hour & Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">Start Time</Label>
                      <select
                        value={walkInHour}
                        onChange={(e) => setWalkInHour(parseInt(e.target.value, 10))}
                        className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-red-500"
                      >
                        {OPERATING_SLOTS.map((h) => (
                          <option key={h} value={h}>
                            {formatHour(h)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">Duration</Label>
                      <select
                        value={walkInDuration}
                        onChange={(e) => setWalkInDuration(parseInt(e.target.value, 10))}
                        className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-red-500"
                      >
                        <option value={1}>1 Hour (₱300)</option>
                        <option value={2}>2 Hours (₱600)</option>
                        <option value={3}>3 Hours (₱900)</option>
                        <option value={4}>4 Hours (₱1,200)</option>
                      </select>
                    </div>
                  </div>

                  {/* Player Name & Contact */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Player Full Name</Label>
                    <Input
                      placeholder="e.g. Alex Santos"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      required
                      className="bg-slate-950 border-white/10 text-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Phone Number (Optional)</Label>
                    <Input
                      placeholder="e.g. 0917 123 4567"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      className="bg-slate-950 border-white/10 text-white rounded-xl"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Tender Collected</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWalkInPaymentMethod('cash')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                          walkInPaymentMethod === 'cash'
                            ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border-amber-400 font-black shadow-md'
                            : 'bg-slate-950 border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <Banknote className="w-4 h-4" /> Cash (Counter)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWalkInPaymentMethod('counter_qr')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                          walkInPaymentMethod === 'counter_qr'
                            ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border-amber-400 font-black shadow-md'
                            : 'bg-slate-950 border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <QrCode className="w-4 h-4" /> Counter QR Ph
                      </button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={walkInLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-black rounded-xl h-11 shadow-lg"
                  >
                    {walkInLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Confirm & Collect ₱${(300 * walkInDuration).toFixed(2)}`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Interactive Month Occupancy Heatmap Calendar Dialog */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-md bg-[#161922] border-white/15 text-slate-100 rounded-3xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-400" /> Month Occupancy Calendar
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Select any date to inspect court occupancy and scheduled sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Calendar
              mode="single"
              selected={new Date(`${currentDate}T00:00:00`)}
              modifiers={calendarModifiers}
              onSelect={(d) => {
                if (d) {
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  handleDateSelect(`${yyyy}-${mm}-${dd}`);
                  setIsCalendarOpen(false);
                }
              }}
              className="rounded-2xl border border-white/10 bg-slate-950 p-3"
            />

            {/* Occupancy Legend */}
            <div className="flex items-center justify-between mt-4 p-3 bg-slate-900/80 rounded-2xl border border-white/5 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                <span>Open Slots</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50" />
                <span>Almost Full (65%+)</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                <span>Fully Occupied</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Day Summary & Occupancy Ribbon */}
      <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#141824] border border-white/10 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <span className="font-extrabold text-sm text-white">{displayFormattedDate}</span>
            {isTodayActive && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Today
              </span>
            )}
          </div>

          {/* Facility Occupancy Meter */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs">
            <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-medium">Facility Occupancy:</span>
            <span
              className={`font-black ${
                occupancyPercent >= 80
                  ? 'text-red-400'
                  : occupancyPercent >= 50
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {occupancyPercent}% ({totalHoursBooked}/{totalCapacityHours} hrs booked)
            </span>
            {/* Visual Progress Bar */}
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden ml-1">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  occupancyPercent >= 80
                    ? 'bg-red-500'
                    : occupancyPercent >= 50
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, occupancyPercent)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Active Bookings:</span>
            <span className="font-black text-amber-400">{bookings.length} sessions</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Checked In:</span>
            <span className="font-black text-emerald-400">{checkedInCount} / {bookings.length}</span>
          </div>
        </div>
      </div>

      {/* TIMELINE GRID CONTAINER */}
      <div className="flex-1 bg-[#14161f]/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-0 backdrop-blur-xl">
        <ScrollArea className="flex-1">
          <div className="min-w-[2000px]">
            
            {/* Timeline Header: Fixed Court Column + 16 Hourly Slot Columns */}
            <div className="flex border-b border-white/10 sticky top-0 z-30 bg-[#0f1118]/95 backdrop-blur-md relative">
              <div className="w-[260px] min-w-[260px] p-4 font-black text-xs uppercase tracking-wider text-amber-400 border-r border-white/10 bg-[#0f1118]/95 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.6)] flex items-center gap-2 sticky left-0 z-40">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Courts (Indoor)</span>
              </div>

              <div
                className="flex-1 grid relative"
                style={{
                  gridTemplateColumns: `repeat(${OPERATING_SLOTS.length}, minmax(110px, 1fr))`,
                }}
              >
                {OPERATING_SLOTS.map((hour, idx) => (
                  <div
                    key={hour}
                    style={{ gridColumn: idx + 1 }}
                    className="p-4 text-center text-xs font-black text-slate-300 border-r border-white/10 bg-slate-950/60 flex items-center justify-center"
                  >
                    {formatHour(hour)}
                  </div>
                ))}

                {/* Live Current Time Laser Header Marker */}
                {isTodayActive && isLiveOperating && (
                  <div
                    style={{ left: `${liveOffsetPercent}%` }}
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none shadow-[0_0_12px_2px_rgba(239,68,68,0.9)]"
                  >
                    <span className="absolute -bottom-2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-xl flex items-center gap-1 border border-white/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE NOW {formatHour(currentPhtHour)}:{String(currentPhtMinute).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Rows per Court: Left Court Card + Right 16-Slot Track */}
            <div className="relative divide-y divide-white/10">
              {courts.map((court) => {
                const courtBookings = bookings.filter((b) => {
                  const bCourtId = b.courts?.id || b.court_id;
                  return bCourtId === court.id;
                });

                // Check if court has an active match in session right now
                const activeNowBooking = isTodayActive
                  ? courtBookings.find((b) => {
                      const startMs = new Date(b.start_time).getTime();
                      const endMs = new Date(b.end_time).getTime();
                      const now = currentTime.getTime();
                      return now >= startMs && now < endMs && ['paid', 'checked_in', 'walk_in'].includes(b.status);
                    })
                  : null;

                return (
                  <div
                    key={court.id}
                    className="flex border-b border-white/10 min-h-[115px] relative group hover:bg-white/[0.01] transition-colors"
                  >
                    {/* Fixed Left Column: Court Info + Live Occupancy Badge */}
                    <div className="w-[260px] min-w-[260px] p-4 text-xs font-bold text-white border-r border-white/10 bg-[#12141c]/95 group-hover:bg-[#161924] sticky left-0 z-20 flex flex-col justify-between shadow-[4px_0_8px_-2px_rgba(0,0,0,0.6)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50" />
                          <span className="font-black text-sm text-white tracking-tight">{court.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-4.5 text-[11px] font-bold text-amber-400">
                          <span>₱{Number(court.hourly_rate ?? 1).toFixed(2)}/hr</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">8mm Pro Cushion</span>
                        </div>
                      </div>

                      {/* Live Court Occupancy Status Indicator */}
                      {isTodayActive ? (
                        activeNowBooking ? (
                          <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-red-950/80 border border-red-500/60 shadow-md shadow-red-500/10">
                            <div className="flex items-center gap-1.5 text-red-300">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-wider">🔴 OCCUPIED (IN PLAY)</span>
                            </div>
                            <p className="text-[11px] font-bold text-white truncate mt-0.5">
                              👤 {activeNowBooking.guest_name}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-[10px] font-black uppercase tracking-wider">🟢 COURT VACANT</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                              Open for Walk-In / Play
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="mt-2 px-2.5 py-1 rounded-xl bg-slate-900/60 border border-white/5 text-[10px] font-bold text-slate-400">
                          <span>{courtBookings.length} sessions booked</span>
                        </div>
                      )}
                    </div>

                    {/* Right Timeline Grid (16 columns) */}
                    <div
                      className="flex-1 grid relative"
                      style={{
                        gridTemplateColumns: `repeat(${OPERATING_SLOTS.length}, minmax(110px, 1fr))`,
                      }}
                    >
                      {/* 16 Background Slot Columns (Click to Quick Book) */}
                      {OPERATING_SLOTS.map((hour, idx) => (
                        <div
                          key={hour}
                          style={{
                            gridColumn: idx + 1,
                            gridRow: 1,
                          }}
                          onClick={() => openWalkInForSlot(court.id, hour)}
                          className="border-r border-white/10 h-full relative group/cell hover:bg-emerald-500/10 cursor-pointer transition-colors flex items-center justify-center min-h-[115px]"
                          title={`Click to book ${court.name} at ${formatHour(hour)}`}
                        >
                          <span className="opacity-0 group-hover/cell:opacity-100 text-[10px] font-black text-emerald-400 bg-emerald-950/90 px-2 py-1 rounded-lg border border-emerald-500/40 pointer-events-none transition-opacity shadow-lg">
                            + Book
                          </span>
                        </div>
                      ))}

                      {/* Live Current Time Laser Row Marker */}
                      {isTodayActive && isLiveOperating && (
                        <div
                          style={{ left: `${liveOffsetPercent}%` }}
                          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none shadow-[0_0_10px_2px_rgba(239,68,68,0.8)]"
                        />
                      )}

                      {/* Placed Distinct Booking Blocks in Row 1 */}
                      {courtBookings.map((booking) => {
                        const isCheckedIn = booking.status === 'checked_in';
                        const isWalkIn = booking.status === 'walk_in';
                        const isPendingLock = booking.status === 'pending_payment';
                        const customerName = booking.guest_name || 'Player';

                        const startMs = new Date(booking.start_time).getTime();
                        const endMs = new Date(booking.end_time).getTime();
                        const isMatchInPlay = isTodayActive && currentTime.getTime() >= startMs && currentTime.getTime() < endMs;
                        const isMatchPast = isTodayActive && currentTime.getTime() >= endMs;

                        const isPaddleRental =
                          booking.notes?.toLowerCase().includes('paddle') || false;

                        // Check if matches user search query
                        const matchesSearch =
                          !searchQuery.trim() ||
                          customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (booking.guest_phone && booking.guest_phone.includes(searchQuery)) ||
                          booking.id.toLowerCase().includes(searchQuery.toLowerCase());

                        return (
                          <div
                            key={booking.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                            }}
                            className={`rounded-2xl p-3 text-xs font-bold cursor-pointer flex flex-col justify-between shadow-xl transition-all duration-150 border-2 my-2 mx-1.5 overflow-hidden z-10 ${
                              !matchesSearch ? 'opacity-30' : 'opacity-100 hover:scale-[1.02] hover:z-30'
                            } ${
                              isMatchInPlay
                                ? 'bg-gradient-to-br from-red-950/95 via-slate-900 to-red-900/70 text-red-100 border-red-400 shadow-red-500/30 ring-2 ring-red-500/60 ring-offset-2 ring-offset-slate-950'
                                : isMatchPast
                                ? 'bg-slate-900/90 text-slate-400 border-white/10 opacity-75'
                                : isCheckedIn
                                ? 'bg-gradient-to-br from-blue-950/95 via-slate-900 to-blue-900/70 text-blue-100 border-blue-400/80 shadow-blue-500/25'
                                : isWalkIn
                                ? 'bg-gradient-to-br from-purple-950/95 via-slate-900 to-purple-900/70 text-purple-100 border-purple-400/80 shadow-purple-500/25'
                                : isPendingLock
                                ? 'bg-gradient-to-br from-amber-950/85 via-slate-900 to-amber-900/60 text-amber-100 border-amber-400/80 shadow-amber-500/25'
                                : 'bg-gradient-to-br from-emerald-950/95 via-slate-900 to-emerald-900/70 text-emerald-100 border-emerald-400/80 shadow-emerald-500/25'
                            }`}
                            style={{
                              gridColumn: getGridColumn(booking.start_time, booking.end_time),
                              gridRow: 1,
                            }}
                          >
                            {/* Top Row: Distinct Player Name + Status / Occupancy Badge */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                                    isMatchInPlay
                                      ? 'bg-red-500 text-white'
                                      : isCheckedIn
                                      ? 'bg-blue-500 text-white'
                                      : isWalkIn
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-emerald-500 text-slate-950'
                                  }`}
                                >
                                  {customerName.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="font-black text-xs text-white truncate drop-shadow-sm">
                                  {customerName}
                                </span>
                              </div>

                              {/* Status / Occupancy Tag Pill */}
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0 ${
                                  isMatchInPlay
                                    ? 'bg-red-500 text-white border border-red-300 animate-pulse'
                                    : isMatchPast
                                    ? 'bg-white/5 text-slate-400 border border-white/10'
                                    : isCheckedIn
                                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                                    : isWalkIn
                                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                                    : isPendingLock
                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40 animate-pulse'
                                    : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                                }`}
                              >
                                {isMatchInPlay
                                  ? '🔥 IN PLAY (LIVE)'
                                  : isMatchPast
                                  ? '✓ COMPLETED'
                                  : isCheckedIn
                                  ? '✓ CHECKED IN'
                                  : isWalkIn
                                  ? 'WALK-IN'
                                  : isPendingLock
                                  ? 'PAY PENDING'
                                  : 'PAID'}
                              </span>
                            </div>

                            {/* Bottom Row: Time Interval, Paddle Addon, Ref */}
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 pt-1 border-t border-white/10 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                {new Intl.DateTimeFormat('en-PH', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }).format(new Date(booking.start_time))}{' '}
                                –{' '}
                                {new Intl.DateTimeFormat('en-PH', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }).format(new Date(booking.end_time))}
                                <span className="text-slate-400">({booking.duration_hours || 1}h)</span>
                              </span>

                              <div className="flex items-center gap-1">
                                {isPaddleRental && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/30">
                                    🏓 Paddle
                                  </span>
                                )}
                                <span className="text-slate-400 font-mono text-[9px]">
                                  #{booking.id.slice(0, 5).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Detailed Booking Modal with Player Details & 1-Click Check-in */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg bg-[#161922] border-white/15 text-slate-100 rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between pb-2">
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Court Session Details
              </DialogTitle>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                  selectedBooking?.status === 'checked_in'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : selectedBooking?.status === 'walk_in'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {selectedBooking?.status?.toUpperCase()}
              </span>
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Booking Ref: <strong className="font-mono text-amber-400">#{selectedBooking?.id}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-2">
              
              {/* Player Identity Card */}
              <div className="p-4 rounded-2xl bg-[#0f1117] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-base text-white">
                      {selectedBooking.guest_name || 'Walk-in Player'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    ₱{Number(selectedBooking.total_price || 300).toFixed(2)} Paid
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                  {selectedBooking.guest_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedBooking.guest_phone}</span>
                    </div>
                  )}
                  {selectedBooking.guest_email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{selectedBooking.guest_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#0f1117] p-4 rounded-2xl border border-white/10">
                <div>
                  <p className="text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" /> Assigned Court
                  </p>
                  <p className="font-black text-white">
                    {selectedBooking.courts?.name || 'Court 1 - Indoor'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-emerald-400" /> Payment Tender
                  </p>
                  <p className="font-black text-amber-400 capitalize">
                    {selectedBooking.payment_method === 'counter_qr'
                      ? 'Counter QR Ph'
                      : selectedBooking.payment_method || 'Online PayMongo'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Session Time
                  </p>
                  <p className="font-black text-white">
                    {new Intl.DateTimeFormat('en-PH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(selectedBooking.start_time))}{' '}
                    –{' '}
                    {new Intl.DateTimeFormat('en-PH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(selectedBooking.end_time))}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-400" /> Duration
                  </p>
                  <p className="font-black text-white">
                    {selectedBooking.duration_hours || 1} Hour{selectedBooking.duration_hours && selectedBooking.duration_hours > 1 ? 's' : ''} Session
                  </p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <strong>Special Note:</strong> {selectedBooking.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedBooking(null)}
              className="border-white/15 text-slate-300 hover:text-white rounded-xl"
            >
              Close
            </Button>
            {selectedBooking?.status !== 'checked_in' && (
              <Button
                onClick={handleCheckIn}
                disabled={isPending}
                className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black rounded-xl shadow-lg shadow-red-500/30"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Confirm Player Check-in
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}