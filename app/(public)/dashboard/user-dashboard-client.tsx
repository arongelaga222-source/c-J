'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  Plus,
  Printer,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  Award,
  Zap,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { cancelBooking } from '@/app/actions';
import { RefundRequestModal } from '@/components/refund-request-modal';

export interface UserBookingItem {
  id: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_price: number;
  currency: string;
  status: string;
  payment_method: string;
  court_name: string;
  created_at: string;
  refund_wallet_type?: string | null;
  refund_account_name?: string | null;
  refund_account_number?: string | null;
  refund_status?: string | null;
  refund_reference?: string | null;
}

export default function UserDashboardClient({
  profile,
  email,
  bookings,
}: {
  profile: { full_name: string | null; created_at: string };
  email: string;
  bookings: UserBookingItem[];
}) {
  const [activeBookings, setActiveBookings] = useState<UserBookingItem[]>(bookings);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refundModalBooking, setRefundModalBooking] = useState<UserBookingItem | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const upcomingBookings = activeBookings.filter(
    (b) => new Date(b.start_time) > now && !['cancelled', 'expired'].includes(b.status)
  );
  const pastBookings = activeBookings.filter(
    (b) => new Date(b.start_time) <= now || ['cancelled', 'expired'].includes(b.status)
  );

  const firstName = profile?.full_name?.split(' ')[0] || 'Player';
  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'P';

  const totalHoursPlayed = pastBookings.reduce((acc, curr) => acc + (curr.duration_hours || 1), 0);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));

  const formatTime = (dateStr: string) =>
    new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(dateStr)
    );

  const formatMemberSince = (dateStr: string) =>
    new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(
      new Date(dateStr)
    );

  // Check 24-hour cancellation eligibility
  const getCancellationInfo = (startTimeStr: string) => {
    const startTime = new Date(startTimeStr).getTime();
    const diffHours = (startTime - Date.now()) / (1000 * 60 * 60);
    const isEligible = diffHours >= 24;
    return {
      isEligible,
      hoursRemaining: diffHours,
    };
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? If eligible, a refund request will be processed.')) {
      return;
    }

    setCancellingId(bookingId);
    setFeedbackMessage(null);

    startTransition(async () => {
      const res = await cancelBooking(bookingId);
      if (res.error) {
        setFeedbackMessage({ type: 'error', text: res.error });
      } else {
        setFeedbackMessage({
          type: 'success',
          text: res.message || 'Booking cancelled successfully.',
        });
        setActiveBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: res.status || 'cancelled_refund_pending' } : b
          )
        );
      }
      setCancellingId(null);
    });
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-10 space-y-8 font-sans text-slate-100 bg-[#0f1218]">
      
      {/* Profile Header Card with Court Backdrop */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 p-4 sm:p-8 rounded-3xl border border-white/10 bg-[#171b24]/90 backdrop-blur-xl shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15 filter contrast-125 saturate-125 -z-10"
          style={{ backgroundImage: "url('/cj-court-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171b24] via-[#171b24]/90 to-red-950/40 -z-10" />

        <div className="flex items-center space-x-3 sm:space-x-4 relative z-10">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-[#d4ff00] shadow-xl shadow-[#d4ff00]/20 shrink-0">
            <AvatarFallback className="bg-gradient-to-tr from-red-600 via-red-500 to-amber-400 text-white font-black text-base sm:text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white truncate">{firstName}&apos;s Player Pass</h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-[#d4ff00]/20 text-[#d4ff00] border border-[#d4ff00]/30 shadow-sm">
                C&amp;J Player
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 flex flex-wrap items-center gap-1.5">
              <span>🏟️ Tomas Morato Arena</span>
              <span className="hidden sm:inline">•</span>
              <span>Member since {profile?.created_at ? formatMemberSince(profile.created_at) : 'recently'}</span>
            </p>
          </div>
        </div>
        <Link href="/book" className="relative z-10 w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black px-5 sm:px-6 h-10 sm:h-11 shadow-lg shadow-red-500/20 rounded-xl text-xs sm:text-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Book a Court (₱300/hr)
          </Button>
        </Link>
      </div>

      {/* Quick Player Stats Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#171b24] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-bold">
            <span>Upcoming</span>
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4ff00]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{upcomingBookings.length}</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400">Scheduled sessions</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#171b24] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-bold">
            <span>Court Hours</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#d4ff00]">{totalHoursPlayed} hrs</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400">Lifetime play</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#171b24] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-bold">
            <span>Surface</span>
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <p className="text-xs sm:text-sm font-black text-white pt-1">8mm Cushion</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400">Knee protection</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#171b24] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-bold">
            <span>DUPR Tier</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
          </div>
          <p className="text-xs sm:text-sm font-black text-white pt-1">All Levels</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400">Casual &amp; Shootouts</p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-[#171b24] border border-white/10 p-1 rounded-2xl">
          <TabsTrigger
            value="upcoming"
            className="rounded-xl text-xs font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-amber-500 data-[state=active]:text-white"
          >
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl text-xs font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-amber-500 data-[state=active]:text-white"
          >
            History ({pastBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="rounded-xl text-xs font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-amber-500 data-[state=active]:text-white"
          >
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Bookings Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((b) => {
              const { isEligible, hoursRemaining } = getCancellationInfo(b.start_time);
              const isCurrentlyCancelling = cancellingId === b.id;

              return (
                <Card
                  key={b.id}
                  className="border-white/10 bg-[#171b24]/90 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl"
                >
                  <div className="bg-[#0f1218]/90 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                    {b.status === 'cancelled_refund_pending' ? (
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Refund Queued • {b.refund_wallet_type || 'E-Wallet'}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-black uppercase tracking-wider text-[#d4ff00] bg-[#d4ff00]/10 px-2.5 py-0.5 rounded border border-[#d4ff00]/20">
                        {b.status === 'checked_in' ? 'Checked In' : 'Confirmed • ' + b.status}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      Ref: #{b.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-white text-base font-bold">
                        <CalendarDays className="mr-2.5 h-4 w-4 text-[#d4ff00]" />
                        <span>{formatDate(b.start_time)}</span>
                      </div>
                      <div className="flex items-center text-slate-300 text-xs">
                        <Clock className="mr-2.5 h-4 w-4 text-red-400" />
                        {formatTime(b.start_time)} – {formatTime(b.end_time)} ({b.duration_hours} hr
                        {b.duration_hours > 1 ? 's' : ''})
                      </div>
                      <div className="flex items-center text-slate-400 text-xs">
                        <MapPin className="mr-2.5 h-4 w-4 text-amber-400" />
                        {b.court_name}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                      <div className="text-2xl font-black text-[#d4ff00]">
                        ₱{Number(b.total_price).toFixed(2)}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Printable Ticket Link */}
                        <Link href={`/booking/success/${b.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-bold h-9"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" /> View Ticket
                          </Button>
                        </Link>

                        {/* Refund Status / Cancellation Button */}
                        {b.status === 'cancelled_refund_pending' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-bold">
                            <Wallet className="w-3.5 h-3.5 text-[#d4ff00]" />
                            <span>P{Number(b.total_price).toFixed(0)} to {b.refund_wallet_type || 'E-Wallet'} ({b.refund_account_number}) pending</span>
                          </div>
                        ) : isEligible ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCurrentlyCancelling || isPending}
                            onClick={() => setRefundModalBooking(b)}
                            className="border-red-500/40 text-red-400 hover:bg-red-950/40 rounded-xl text-xs font-bold h-9"
                          >
                            Cancel &amp; Refund
                          </Button>
                        ) : (
                          <div
                            className="flex items-center text-[10px] text-slate-500 font-bold bg-[#0f1218] px-2.5 py-1.5 rounded-xl border border-white/5"
                            title="Strict 24-hour cancellation rule applies."
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-500 mr-1" />
                            Locked (&lt;24h away)
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16 bg-[#171b24]/40 rounded-3xl border border-dashed border-white/10 space-y-4">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <p className="text-base font-bold text-white">No upcoming court reservations</p>
                <p className="text-xs text-slate-400">
                  Ready to serve? Lock an indoor court slot today at C&amp;J Court.
                </p>
              </div>
              <Link href="/book">
                <Button className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-black rounded-xl">
                  Browse Available Courts
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Past Play &amp; Order History</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                A historical log of your previous court sessions at C&amp;J Court.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastBookings.length > 0 ? (
                <div className="space-y-3">
                  {pastBookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-[#0f1218]/80"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{formatDate(b.start_time)}</p>
                        <p className="text-xs text-slate-400">
                          {b.court_name} • {formatTime(b.start_time)} – {formatTime(b.end_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-[#d4ff00]">
                          ₱{Number(b.total_price).toFixed(2)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          {b.refund_status === 'completed' ? (
                            <span className="text-emerald-400">
                              Refunded ({b.refund_wallet_type || 'E-Wallet'}) {b.refund_reference ? `• Ref: ${b.refund_reference}` : ''}
                            </span>
                          ) : (
                            b.status
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No past bookings found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-white/10 bg-[#171b24]/90 backdrop-blur-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Account Details</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Your player profile and registered email at C&amp;J Court.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 bg-[#0f1218] p-4 rounded-xl border border-white/5">
                  <p className="text-xs font-bold text-slate-400">Full Name</p>
                  <p className="text-sm font-bold text-white">{profile?.full_name || 'Valued Player'}</p>
                </div>
                <div className="space-y-1 bg-[#0f1218] p-4 rounded-xl border border-white/5">
                  <p className="text-xs font-bold text-slate-400">Registered Email</p>
                  <p className="text-sm font-bold text-white">{email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {refundModalBooking && (
        <RefundRequestModal
          isOpen={Boolean(refundModalBooking)}
          onClose={() => setRefundModalBooking(null)}
          booking={{
            id: refundModalBooking.id,
            court_name: refundModalBooking.court_name,
            start_time: refundModalBooking.start_time,
            duration_hours: refundModalBooking.duration_hours,
            total_price: refundModalBooking.total_price,
          }}
          onSuccess={(msg) => {
            setFeedbackMessage({ type: 'success', text: msg });
            setActiveBookings((prev) =>
              prev.map((item) =>
                item.id === refundModalBooking.id
                  ? {
                      ...item,
                      status: 'cancelled_refund_pending',
                      refund_status: 'pending',
                    }
                  : item
              )
            );
          }}
        />
      )}
    </div>
  );
}
