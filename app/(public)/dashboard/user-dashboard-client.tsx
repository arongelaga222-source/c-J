'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Printer,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  Award,
  Lock,
} from 'lucide-react';
import { cancelBooking, updateUserPassword } from '@/app/actions';
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
  const [passwordState, setPasswordState] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUpdatePassword = async (formData: FormData) => {
    setIsUpdatingPassword(true);
    setPasswordState(null);
    const result = await updateUserPassword(formData);
    if (result.error) {
      setPasswordState({ type: 'error', text: result.error });
    } else {
      setPasswordState({ type: 'success', text: 'Password updated successfully!' });
      (document.getElementById('password-form') as HTMLFormElement).reset();
    }
    setIsUpdatingPassword(false);
  };

  const now = new Date();
  const upcomingBookings = activeBookings.filter(
    (b) => new Date(b.start_time) > now && !['cancelled', 'expired'].includes(b.status)
  );
  const pastBookings = activeBookings.filter(
    (b) => new Date(b.start_time) <= now || ['cancelled', 'expired'].includes(b.status)
  );

  const firstName = profile?.full_name?.split(' ')[0] || 'Player';
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

  const getCancellationInfo = (startTimeStr: string) => {
    const bookingDate = new Date(startTimeStr);
    const msDiff = bookingDate.getTime() - Date.now();
    const hoursRemaining = msDiff / (1000 * 60 * 60);

    return {
      isEligible: hoursRemaining >= 24,
      hoursRemaining: Math.max(0, Math.floor(hoursRemaining)),
      hoursTotal: hoursRemaining,
    };
  };

  const handleCancelClick = (booking: UserBookingItem) => {
    const info = getCancellationInfo(booking.start_time);
    if (!info.isEligible) {
      setFeedbackMessage({
        type: 'error',
        text: 'Cancellations must be made at least 24 hours in advance to receive a refund.',
      });
      return;
    }
    setRefundModalBooking(booking);
  };

  const handleRefundConfirmed = (bookingId: string) => {
    setRefundModalBooking(null);
    setFeedbackMessage({
      type: 'success',
      text: 'Booking cancelled. Refund request submitted for processing within 24-48 hours.',
    });
    startTransition(async () => {
      setCancellingId(bookingId);
      const res = await cancelBooking(bookingId);
      if (res.error) {
        setFeedbackMessage({ type: 'error', text: res.error });
      } else {
        setActiveBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: 'cancelled', refund_status: 'pending' } : b
          )
        );
      }
      setCancellingId(null);
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-8 md:py-12 font-sans bg-white text-[#111111] space-y-10">
      
      {/* Profile Header Block */}
      <div className="border border-[#cacacb] p-6 sm:p-10 flex flex-col md:flex-row md:items-baseline justify-between gap-6 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#707072]">
              Member Profile
            </span>
            <span className="text-xs text-[#cacacb]">•</span>
            <span className="text-[11px] font-semibold text-[#007d48] bg-[#f5f5f5] px-2.5 py-0.5 rounded-full border border-[#cacacb]">
              Active Player
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-[#111111]">
            {firstName}&apos;S PLAYER PASS
          </h1>
          <p className="text-xs text-[#707072] mt-1">
            Tomas Morato Arena • Member since {profile?.created_at ? formatMemberSince(profile.created_at) : 'recently'}
          </p>
        </div>

        <Link href="/book">
          <Button size="lg" className="bg-[#111111] text-white hover:bg-[#222222] text-sm font-medium h-12 px-8">
            <Plus className="w-4 h-4 mr-2" /> Book a Court (₱300/hr)
          </Button>
        </Link>
      </div>

      {/* Quick Player Stats (4-Up Flat Row with 1px Hairlines) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-[#cacacb] p-6 bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707072] block mb-1">
            Upcoming Bookings
          </span>
          <p className="text-3xl font-bold tracking-tight text-[#111111]">{upcomingBookings.length}</p>
          <span className="text-xs text-[#707072]">Scheduled sessions</span>
        </div>
        <div className="border border-[#cacacb] p-6 bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707072] block mb-1">
            Court Hours
          </span>
          <p className="text-3xl font-bold tracking-tight text-[#111111]">{totalHoursPlayed} hrs</p>
          <span className="text-xs text-[#707072]">Lifetime play</span>
        </div>
        <div className="border border-[#cacacb] p-6 bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707072] block mb-1">
            Court Surface
          </span>
          <p className="text-lg font-bold tracking-tight text-[#111111] pt-1">8mm Cushion</p>
          <span className="text-xs text-[#707072]">Knee protection</span>
        </div>
        <div className="border border-[#cacacb] p-6 bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-[#707072] block mb-1">
            Tournament Spec
          </span>
          <p className="text-lg font-bold tracking-tight text-[#111111] pt-1">USAP Official</p>
          <span className="text-xs text-[#707072]">20&apos; × 44&apos; dimensions</span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 border text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'border-[#007d48] bg-white text-[#007d48]'
              : 'border-[#d30005] bg-white text-[#d30005]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#007d48]" />
            ) : (
              <XCircle className="w-4 h-4 text-[#d30005]" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-[#707072] hover:text-[#111111] cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="flex gap-2 mb-8 bg-transparent p-0 border-b border-[#cacacb] pb-3">
          <TabsTrigger
            value="upcoming"
            className="h-9 px-5 rounded-full text-xs font-medium cursor-pointer border border-[#cacacb] data-[state=active]:bg-[#111111] data-[state=active]:text-white data-[state=active]:border-[#111111]"
          >
            Upcoming Sessions ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="h-9 px-5 rounded-full text-xs font-medium cursor-pointer border border-[#cacacb] data-[state=active]:bg-[#111111] data-[state=active]:text-white data-[state=active]:border-[#111111]"
          >
            Booking History ({pastBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="h-9 px-5 rounded-full text-xs font-medium cursor-pointer border border-[#cacacb] data-[state=active]:bg-[#111111] data-[state=active]:text-white data-[state=active]:border-[#111111]"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Upcoming Bookings */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="border border-[#cacacb] p-12 text-center bg-white space-y-4">
              <CalendarDays className="w-10 h-10 text-[#707072] mx-auto" />
              <h3 className="text-xl font-bold tracking-tight text-[#111111]">No Upcoming Court Bookings</h3>
              <p className="text-xs text-[#707072] max-w-sm mx-auto">
                Ready for a match? Reserve single or multi-hour slots on Courts 1 &amp; 2 at Tomas Morato.
              </p>
              <Link href="/book">
                <Button size="lg" className="bg-[#111111] text-white hover:bg-[#222222] text-xs h-11 px-6 mt-2">
                  Book a Court Now
                </Button>
              </Link>
            </div>
          ) : (
            upcomingBookings.map((b) => {
              const cancelInfo = getCancellationInfo(b.start_time);
              return (
                <div key={b.id} className="border border-[#cacacb] p-6 sm:p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        {b.court_name}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#007d48] border border-[#cacacb]">
                        Confirmed
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#707072]">
                      <div className="flex items-center gap-1.5 text-[#111111] font-semibold">
                        <CalendarDays className="w-4 h-4 text-[#707072]" />
                        <span>{formatDate(b.start_time)}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5 text-[#111111] font-semibold">
                        <Clock className="w-4 h-4 text-[#707072]" />
                        <span>{formatTime(b.start_time)} – {formatTime(b.end_time)} ({b.duration_hours} hr)</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#707072]">
                      Tomas Morato Arena • {b.payment_method} • Total Paid: ₱{b.total_price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="text-xs border-[#cacacb] text-[#111111] hover:bg-[#f5f5f5]"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" /> Pass Receipt
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending && cancellingId === b.id}
                      onClick={() => handleCancelClick(b)}
                      className="text-xs border-[#cacacb] text-[#d30005] hover:bg-[#f5f5f5]"
                    >
                      {isPending && cancellingId === b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Cancel & Refund'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Tab Content: History */}
        <TabsContent value="history" className="space-y-4">
          {pastBookings.length === 0 ? (
            <div className="border border-[#cacacb] p-12 text-center bg-white text-xs text-[#707072]">
              No past sessions or cancelled bookings on record.
            </div>
          ) : (
            pastBookings.map((b) => (
              <div key={b.id} className="border border-[#cacacb] p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#111111]">{b.court_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      b.status === 'cancelled'
                        ? 'bg-[#f5f5f5] text-[#d30005] border border-[#cacacb]'
                        : 'bg-[#f5f5f5] text-[#707072] border border-[#cacacb]'
                    }`}>
                      {b.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-[#707072]">
                    {formatDate(b.start_time)} • {formatTime(b.start_time)} – {formatTime(b.end_time)} ({b.duration_hours} hr) • ₱{b.total_price.toLocaleString()}
                  </p>
                </div>
                <span className="text-[#707072] font-mono text-[11px]">
                  ID: {b.id.slice(0, 8)}...
                </span>
              </div>
            ))
          )}
        </TabsContent>

        {/* Tab Content: Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="border border-[#cacacb] p-6 sm:p-8 bg-white max-w-2xl">
            <h3 className="text-lg font-bold tracking-tight text-[#111111] flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-[#707072]" /> Password Management
            </h3>
            
            {passwordState && (
              <div
                className={`p-4 mb-6 border text-xs font-medium flex items-center justify-between ${
                  passwordState.type === 'success'
                    ? 'border-[#007d48] bg-white text-[#007d48]'
                    : 'border-[#d30005] bg-white text-[#d30005]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {passwordState.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#007d48]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#d30005]" />
                  )}
                  <span>{passwordState.text}</span>
                </div>
              </div>
            )}

            <form id="password-form" action={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  New Password
                </label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  minLength={6}
                  placeholder="Enter new password"
                  className="h-11 w-full px-4 rounded-full border border-[#cacacb] bg-[#f5f5f5] text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                />
                <p className="text-[10px] text-[#707072] mt-1">Must be at least 6 characters long.</p>
              </div>
              <Button type="submit" disabled={isUpdatingPassword} className="bg-[#111111] text-white hover:bg-[#222222] h-11 px-6 rounded-full text-xs font-medium mt-2">
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Refund Modal Component */}
      {refundModalBooking && (
        <RefundRequestModal
          isOpen={!!refundModalBooking}
          booking={refundModalBooking}
          onClose={() => setRefundModalBooking(null)}
          onSuccess={() => handleRefundConfirmed(refundModalBooking.id)}
        />
      )}
    </div>
  );
}
