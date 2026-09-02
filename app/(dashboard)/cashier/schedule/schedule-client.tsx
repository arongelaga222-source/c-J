'use client';

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
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
  LayoutGrid,
  ListTodo,
  Eye,
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

// Helper to extract PHT (UTC+8) date string 'YYYY-MM-DD'
const getPhtDateStr = (isoString: string) => {
  const d = new Date(isoString);
  const pht = new Date(d.getTime() + 8 * 3600 * 1000);
  const yyyy = pht.getUTCFullYear();
  const mm = String(pht.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(pht.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
  const [viewMode, setViewMode] = useState<'month_grid' | 'timeline'>('month_grid');
  const [selectedCourtFilter, setSelectedCourtFilter] = useState<string>('all');
  
  // Date state for month grid navigation
  const [gridMonthDate, setGridMonthDate] = useState<Date>(() => {
    const [y, m] = initialDateStr.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const [bookings, setBookings] = useState<ScheduleBooking[]>(initialBookings);
  const [monthBookings, setMonthBookings] = useState<Record<string, ScheduleBooking[]>>({});
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Realtime clock for live marker (updates every 30s)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Format month string YYYY-MM
  const currentMonthStr = useMemo(() => {
    const yyyy = gridMonthDate.getFullYear();
    const mm = String(gridMonthDate.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }, [gridMonthDate]);

  // Fetch all bookings for the visible month to populate the Calendar Grid
  const fetchMonthAllBookings = useCallback(async (monthStr: string) => {
    try {
      const supabase = createClient();
      const [year, month] = monthStr.split('-').map(Number);
      
      // UTC boundaries covering the entire month in PHT (UTC+8)
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, -8, 0, 0)).toISOString();
      const endOfMonth = new Date(Date.UTC(year, month, 1, 15, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
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
          profiles:profiles!bookings_user_id_fkey ( full_name ),
          courts ( id, name )
        `)
        .gte('end_time', startOfMonth)
        .lte('start_time', endOfMonth)
        .in('status', ['paid', 'checked_in', 'walk_in', 'pending_payment', 'cancelled'])
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading month bookings:', error);
        return;
      }

      if (data) {
        const formatted: ScheduleBooking[] = (data as unknown as ScheduleBooking[]).map((b) => {
          const singleProfile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          const singleCourt = Array.isArray(b.courts) ? b.courts[0] : b.courts;
          return {
            ...b,
            guest_name: b.guest_name || singleProfile?.full_name || 'Walk-in Client',
            profiles: singleProfile || null,
            courts: singleCourt || null,
          };
        });

        // Group by PHT Date YYYY-MM-DD
        const grouped: Record<string, ScheduleBooking[]> = {};
        formatted.forEach((b) => {
          const dateKey = getPhtDateStr(b.start_time);
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(b);
        });

        setMonthBookings(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch month bookings:', err);
    }
  }, []);

  useEffect(() => {
    fetchMonthAllBookings(currentMonthStr);
  }, [currentMonthStr, fetchMonthAllBookings]);

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
          fetchMonthAllBookings(currentMonthStr);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate, currentMonthStr, fetchMonthAllBookings]);

  // Fetch bookings for specific date
  const fetchBookingsForDate = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const startOfDay = new Date(`${dateStr}T00:00:00.000+08:00`).toISOString();
      const endOfDay = new Date(`${dateStr}T23:59:59.999+08:00`).toISOString();

      const { data, error } = await supabase
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
          profiles:profiles!bookings_user_id_fkey ( full_name ),
          courts ( id, name )
        `)
        .gte('end_time', startOfDay)
        .lte('start_time', endOfDay)
        .in('status', ['paid', 'checked_in', 'walk_in', 'pending_payment', 'cancelled'])
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching date schedule:', error);
        return;
      }

      if (data) {
        const formatted: ScheduleBooking[] = (data as unknown as ScheduleBooking[]).map((b) => {
          const singleProfile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          const singleCourt = Array.isArray(b.courts) ? b.courts[0] : b.courts;
          return {
            ...b,
            guest_name: b.guest_name || singleProfile?.full_name || 'Walk-in Client',
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
    const [y, m] = dateStr.split('-').map(Number);
    setGridMonthDate(new Date(y, m - 1, 1));
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

  const handleOffsetMonth = (offset: number) => {
    setGridMonthDate((prev) => {
      const nextMonth = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      return nextMonth;
    });
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
      fetchMonthAllBookings(currentMonthStr);
    });
  };

  const openWalkInForSlot = (courtId: string, hour: number, targetDate?: string) => {
    setWalkInCourtId(courtId);
    setWalkInDate(targetDate || currentDate);
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
          guestName: walkInName.trim() || 'Walk-in Client',
          guestPhone: walkInPhone.trim() || undefined,
          paymentMethod: walkInPaymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create walk-in booking.');

      setIsWalkInOpen(false);
      const playerDisplayName = walkInName.trim() || 'Walk-in Client';
      setWalkInName('');
      setWalkInPhone('');
      
      setSuccessBanner(
        `✓ Walk-in booking confirmed for ${playerDisplayName} on ${walkInDate} (${formatHour(walkInHour)})!`
      );
      setTimeout(() => setSuccessBanner(null), 6000);

      // Refresh both timeline and month bookings
      if (walkInDate !== currentDate) {
        handleDateSelect(walkInDate);
      } else {
        await fetchBookingsForDate(walkInDate);
      }
      await fetchMonthAllBookings(currentMonthStr);
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

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const s = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(startTime));
    const e = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(endTime));
    return `${s} – ${e}`;
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
  const totalHoursBooked = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.duration_hours || 1), 0),
    [bookings]
  );

  const totalCapacityHours = courts.length * (END_HOUR - START_HOUR); // 2 courts * 16 hrs = 32
  const occupancyPercent = totalCapacityHours > 0
    ? Math.round((totalHoursBooked / totalCapacityHours) * 100)
    : 0;

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

  // Calendar Grid Matrix Generation (7 Days x Weeks)
  const calendarGridDays = useMemo(() => {
    const year = gridMonthDate.getFullYear();
    const month = gridMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    const todayStr = getTodayStr();

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = totalDaysInPrevMonth - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === currentDate,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === currentDate,
      });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === currentDate,
      });
    }

    return days;
  }, [gridMonthDate, currentDate]);

  const monthFormattedTitle = new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    year: 'numeric',
  }).format(gridMonthDate);

  return (
    <div className="p-3 sm:p-6 min-h-[calc(100vh)] flex flex-col bg-[#0f1117] text-slate-100 font-sans selection:bg-red-600 selection:text-white space-y-4">
      
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
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

      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-3xl bg-[#141622]/90 border border-white/10 backdrop-blur-xl shadow-xl">
        
        {/* Left Title & Live Pulse */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cashier Court Scheduling
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-3 h-3 animate-pulse" /> Live Scheduler
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time calendar showing all booked time slots and client names with instant check-in.
          </p>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Primary View Switcher: Calendar Grid vs Day Timeline */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-white/15 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('month_grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                viewMode === 'month_grid'
                  ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendar Grid (Client Names)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Day Timeline</span>
            </button>
          </div>

          {/* Client Search Bar */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-950 border border-white/10 text-white rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
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
            onClick={() => {
              fetchBookingsForDate(currentDate);
              fetchMonthAllBookings(currentMonthStr);
            }}
            disabled={isLoading}
            className="border-white/10 bg-slate-950 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl h-9 px-3 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            Sync
          </Button>

          {/* Quick Walk-in Modal Trigger */}
          <Dialog
            open={isWalkInOpen}
            onOpenChange={(open) => {
              if (open) setWalkInDate(currentDate);
              setIsWalkInOpen(open);
            }}
          >
            <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-xs font-black transition-all bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/25 h-9 px-3.5 hover:scale-[1.02] cursor-pointer">
              <Plus className="h-4 w-4 mr-1" /> + Walk-in
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#161922] border-white/15 text-slate-100 rounded-3xl shadow-2xl">
              <form onSubmit={handleCreateWalkIn}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500" /> Walk-In Court Booking
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Immediately reserve a court slot and record cash or counter QR tender.
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
                          {c.name} (₱{Number(c.hourly_rate ?? 300).toFixed(2)}/hr)
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
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={h}>
                            {h} Hour{h > 1 ? 's' : ''} (₱{(300 * h).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Client Name & Contact */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Client Full Name</Label>
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

      {/* ========================================================================= */}
      {/* VIEW 1: MONTH CALENDAR GRID (SHOWS CLIENT NAME OF WHO BOOKED THAT TIME) */}
      {/* ========================================================================= */}
      {viewMode === 'month_grid' && (
        <div className="space-y-4">
          
          {/* Calendar Grid Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#141622]/90 border border-white/10 shadow-md">
            
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOffsetMonth(-1)}
                className="h-8 w-8 text-slate-300 border-white/15 bg-slate-950 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-base sm:text-lg font-black text-white px-2 tracking-wide flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#d4ff00]">
                  {monthFormattedTitle}
                </span>
              </h2>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOffsetMonth(1)}
                className="h-8 w-8 text-slate-300 border-white/15 bg-slate-950 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setGridMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
                  handleDateSelect(getTodayStr());
                }}
                className="h-8 px-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/10 rounded-xl"
              >
                Today
              </Button>
            </div>

            {/* Court Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-bold mr-1">Filter Court:</span>
              <button
                type="button"
                onClick={() => setSelectedCourtFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  selectedCourtFilter === 'all'
                    ? 'bg-[#d4ff00] text-slate-950 shadow-sm'
                    : 'bg-slate-950 border border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                All Courts
              </button>
              {courts.map((court) => (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => setSelectedCourtFilter(court.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                    selectedCourtFilter === court.id
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-950 border border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {court.name.split(' - ')[0]}
                </button>
              ))}
            </div>

          </div>

          {/* 7-Column Calendar Grid Matrix */}
          <div className="rounded-3xl border border-white/10 bg-[#12141c]/95 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
            
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-[#171b26] text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <div
                  key={day}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider ${
                    idx === 0 || idx === 6 ? 'text-amber-400/90' : 'text-slate-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-white/10 bg-[#0f1118]">
              {calendarGridDays.map((dayObj) => {
                const rawDayBookings = monthBookings[dayObj.dateStr] || [];
                const dayBookings = rawDayBookings.filter((b) => {
                  if (selectedCourtFilter !== 'all' && (b.court_id !== selectedCourtFilter && b.courts?.id !== selectedCourtFilter)) {
                    return false;
                  }
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const name = (b.guest_name || b.profiles?.full_name || '').toLowerCase();
                    return name.includes(q);
                  }
                  return true;
                });

                return (
                  <div
                    key={dayObj.dateStr}
                    className={`min-h-[150px] sm:min-h-[190px] p-2 flex flex-col justify-between transition-all group relative ${
                      !dayObj.isCurrentMonth
                        ? 'bg-slate-950/40 text-slate-600 opacity-45'
                        : dayObj.isToday
                        ? 'bg-gradient-to-b from-amber-500/10 via-[#141622] to-[#141622] ring-1 ring-amber-400/40'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    
                    {/* Day Cell Header: Date Number & Session Count */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs sm:text-sm font-black w-6 h-6 rounded-lg flex items-center justify-center ${
                            dayObj.isToday
                              ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md ring-1 ring-amber-300'
                              : dayObj.isCurrentMonth
                              ? 'text-slate-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {dayObj.dayNumber}
                        </span>
                        {dayObj.isToday && (
                          <span className="text-[9px] font-black uppercase text-amber-400 hidden sm:inline">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Booking Count Badge or + Add Walkin Button */}
                      <div className="flex items-center gap-1">
                        {dayBookings.length > 0 ? (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30">
                            {dayBookings.length} Booked
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openWalkInForSlot(courts[0]?.id || '', 8, dayObj.dateStr)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 px-1.5 py-0.5 rounded border border-white/10 cursor-pointer"
                            title="Add Walk-in for this date"
                          >
                            + Book
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Booked Sessions Chips inside Calendar Grid with CLIENT NAMES */}
                    <div className="flex-1 py-1 space-y-1.5 overflow-y-auto max-h-[135px] scrollbar-none">
                      {dayBookings.length === 0 ? (
                        <div className="h-full flex items-center justify-center py-4">
                          <span className="text-[10px] text-slate-600 font-medium italic">
                            {dayObj.isCurrentMonth ? 'Open Court' : ''}
                          </span>
                        </div>
                      ) : (
                        dayBookings.slice(0, 4).map((b) => {
                          const courtName = b.courts?.name || (b.court_id?.includes('80d4') ? 'Court 1' : 'Court 2');
                          const courtLabel = courtName.includes('2') ? 'Court 2' : 'Court 1';
                          const isCheckedIn = b.status === 'checked_in';
                          const isWalkIn = b.status === 'walk_in';
                          const isCancelled = b.status === 'cancelled';
                          const isPending = b.status === 'pending_payment';
                          const clientDisplayName = b.guest_name || b.profiles?.full_name || 'Client';

                          return (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                              }}
                              className={`p-1.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col gap-1 ${
                                isCancelled
                                  ? 'bg-slate-900/80 border-slate-700/50 text-slate-400 opacity-60'
                                  : isCheckedIn
                                  ? 'bg-blue-950/80 border-blue-500/50 text-blue-200 hover:border-blue-300'
                                  : isWalkIn
                                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-200 hover:border-purple-300'
                                  : isPending
                                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200 hover:border-amber-300'
                                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 hover:border-emerald-300'
                              }`}
                              title={`Click to check in: ${clientDisplayName} (${formatTimeSlot(b.start_time, b.end_time)})`}
                            >
                              {/* Top row: Client Full Name in bold + Avatar */}
                              <div className="flex items-center gap-1.5 truncate">
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                                    courtLabel === 'Court 1' ? 'bg-amber-400 text-slate-950' : 'bg-red-500 text-white'
                                  }`}
                                >
                                  {clientDisplayName.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-black text-white truncate drop-shadow-sm">
                                  {clientDisplayName}
                                </span>
                              </div>

                              {/* Bottom row: Time Range + Court Name + Status */}
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                                <span className="font-mono text-slate-300 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                                  {formatTimeSlot(b.start_time, b.end_time)}
                                </span>
                                <span
                                  className={`px-1 py-0.2 rounded font-black text-[8px] uppercase ${
                                    courtLabel === 'Court 1'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-red-500/20 text-red-300'
                                  }`}
                                >
                                  {courtLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {dayBookings.length > 4 && (
                        <button
                          type="button"
                          onClick={() => {
                            handleDateSelect(dayObj.dateStr);
                            setViewMode('timeline');
                          }}
                          className="w-full text-center text-[9px] font-black text-amber-400 hover:underline bg-amber-500/10 py-0.5 rounded border border-amber-500/20 block"
                        >
                          +{dayBookings.length - 4} more • Open Day Timeline →
                        </button>
                      )}
                    </div>

                    {/* Footer link to switch to single day timeline */}
                    <div className="pt-1 border-t border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          handleDateSelect(dayObj.dateStr);
                          setViewMode('timeline');
                        }}
                        className="text-[9px] text-slate-400 hover:text-white font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eye className="w-2.5 h-2.5 text-amber-400" /> Day Timeline
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: HOURLY MULTI-COURT DAY TIMELINE */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* Day Selector & Occupancy Ribbon */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#141824] border border-white/10 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOffsetDay(-1)}
                  className="h-7 w-7 text-slate-400 hover:text-white rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-extrabold text-sm text-white">{displayFormattedDate}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOffsetDay(1)}
                  className="h-7 w-7 text-slate-400 hover:text-white rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
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

                    {/* Live Current Time Laser Marker */}
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

                {/* Timeline Rows per Court */}
                <div className="relative divide-y divide-white/10">
                  {courts.map((court) => {
                    const courtBookings = bookings.filter((b) => {
                      const bCourtId = b.courts?.id || b.court_id;
                      return bCourtId === court.id;
                    });

                    return (
                      <div
                        key={court.id}
                        className="flex border-b border-white/10 min-h-[115px] relative group hover:bg-white/[0.01] transition-colors"
                      >
                        {/* Court Info */}
                        <div className="w-[260px] min-w-[260px] p-4 text-xs font-bold text-white border-r border-white/10 bg-[#12141c]/95 group-hover:bg-[#161924] sticky left-0 z-20 flex flex-col justify-between shadow-[4px_0_8px_-2px_rgba(0,0,0,0.6)]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50" />
                              <span className="font-black text-sm text-white tracking-tight">{court.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 ml-4.5 text-[11px] font-bold text-amber-400">
                              <span>₱{Number(court.hourly_rate ?? 300).toFixed(2)}/hr</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">Indoor Cushion</span>
                            </div>
                          </div>
                        </div>

                        {/* 16 Hourly Slots Track */}
                        <div
                          className="flex-1 grid relative bg-[#12141c]/40"
                          style={{
                            gridTemplateColumns: `repeat(${OPERATING_SLOTS.length}, minmax(110px, 1fr))`,
                          }}
                        >
                          {OPERATING_SLOTS.map((hour, idx) => (
                            <div
                              key={hour}
                              style={{ gridColumn: idx + 1, gridRow: 1 }}
                              className="border-r border-white/5 h-full relative group/slot flex items-center justify-center p-2"
                            >
                              <button
                                type="button"
                                onClick={() => openWalkInForSlot(court.id, hour)}
                                className="opacity-0 group-hover/slot:opacity-100 transition-all text-[10px] font-black bg-slate-900/90 text-amber-400 hover:text-white border border-amber-500/40 hover:bg-amber-500/20 px-2 py-1 rounded-xl shadow-lg flex items-center gap-1 z-10 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Book
                              </button>
                            </div>
                          ))}

                          {/* Render Scheduled Booking Cards on Timeline with CLIENT NAME */}
                          {courtBookings.map((booking) => {
                            const isCheckedIn = booking.status === 'checked_in';
                            const isWalkIn = booking.status === 'walk_in';
                            const isCancelled = booking.status === 'cancelled';
                            const isPending = booking.status === 'pending_payment';
                            const clientDisplayName = booking.guest_name || booking.profiles?.full_name || 'Client';

                            return (
                              <div
                                key={booking.id}
                                onClick={() => setSelectedBooking(booking)}
                                className={`absolute inset-y-2 rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-200 z-10 shadow-lg border hover:scale-[1.01] ${
                                  isCancelled
                                    ? 'bg-slate-900/80 border-slate-700/50 text-slate-400 opacity-60'
                                    : isCheckedIn
                                    ? 'bg-gradient-to-r from-blue-900/90 to-blue-950/90 border-blue-400/60 shadow-blue-500/20'
                                    : isWalkIn
                                    ? 'bg-gradient-to-r from-purple-900/90 to-purple-950/90 border-purple-400/60 shadow-purple-500/20'
                                    : isPending
                                    ? 'bg-gradient-to-r from-amber-900/90 to-amber-950/90 border-amber-400/60 shadow-amber-500/20'
                                    : 'bg-gradient-to-r from-emerald-900/90 to-emerald-950/90 border-emerald-400/60 shadow-emerald-500/20'
                                }`}
                                style={{
                                  gridColumn: getGridColumn(booking.start_time, booking.end_time),
                                  gridRow: 1,
                                }}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black bg-amber-400 text-slate-950">
                                      {clientDisplayName.slice(0, 1).toUpperCase()}
                                    </div>
                                    <span className="font-black text-xs text-white truncate drop-shadow-sm">
                                      {clientDisplayName}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-white">
                                    {booking.status}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 pt-1 border-t border-white/10 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                    {formatTimeSlot(booking.start_time, booking.end_time)}
                                  </span>
                                  <span className="font-mono text-amber-400">#{booking.id.slice(0, 5)}</span>
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

        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED BOOKING MODAL WITH CLIENT DETAILS & 1-CLICK CHECK-IN */}
      {/* ========================================================================= */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg bg-[#161922] border-white/15 text-slate-100 rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between pb-2">
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Court Reservation Details
              </DialogTitle>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                  selectedBooking?.status === 'checked_in'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : selectedBooking?.status === 'walk_in'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : selectedBooking?.status === 'pending_payment'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
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
              
              {/* Client Identity Card */}
              <div className="p-4 rounded-2xl bg-[#0f1117] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-base text-white">
                      {selectedBooking.guest_name || 'Walk-in Client'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    ₱{Number(selectedBooking.total_price || 300).toFixed(2)}
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
                    {formatTimeSlot(selectedBooking.start_time, selectedBooking.end_time)}
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
            {selectedBooking?.status !== 'checked_in' && selectedBooking?.status !== 'cancelled' && (
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