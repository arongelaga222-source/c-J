'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Printer,
  CalendarDays,
  Clock,
  MapPin,
  Flame,
  ArrowRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';

export interface BookingDisplayData {
  id: string;
  courtName: string;
  courtType: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalPrice: number;
  currency: string;
  status: string;
  paymentMethod: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  notes?: string | null;
  createdAt: string;
}

export default function BookingSuccessClient({ booking }: { booking: BookingDisplayData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#ffffff'],
      });
    } catch {
      // ignore
    }

    // Generate check-in QR Code
    QRCode.toDataURL(
      JSON.stringify({
        ref: booking.id,
        court: booking.courtName,
        player: booking.guestName,
        start: booking.startTime,
        system: 'C&J Court',
      }),
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }
    ).then((url) => setQrDataUrl(url));
  }, [booking]);

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const formattedDate = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(startDate);

  const formatTime = (d: Date) =>
    new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(d);

  const timeSlotRange = `${formatTime(startDate)} – ${formatTime(endDate)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12 space-y-8 font-sans text-slate-100">
      
      {/* Header Banner - Hidden during Print */}
      <div className="text-center space-y-3 print:hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-black border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Payment Verified • Court Reserved Successfully</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          You&apos;re Ready to Play!
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          A copy of your booking receipt and check-in QR code has been sent to{' '}
          <span className="text-amber-400 font-bold">{booking.guestEmail}</span>.
        </p>
      </div>

      {/* Action Buttons Bar - Hidden during Print */}
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <Button
          onClick={handlePrint}
          className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black px-6 h-11 rounded-xl shadow-lg shadow-red-500/20 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF Receipt
        </Button>
        <Link href="/book">
          <Button variant="outline" className="border-white/15 text-slate-200 hover:bg-white/10 h-11 rounded-xl font-bold">
            Book Another Court
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" className="text-amber-400 hover:bg-amber-500/10 h-11 rounded-xl font-bold flex items-center gap-1.5">
            View My Portal <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Printable Ticket & Receipt Card Container */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl border-white/15 bg-gradient-to-b from-[#1c1f26] to-[#14161b] rounded-3xl overflow-hidden shadow-2xl print:border-black print:shadow-none print:bg-white print:text-black">
          
          {/* Ticket Top Athletic Header */}
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 p-6 text-white flex items-center justify-between print:bg-none print:text-black print:border-b print:border-slate-300">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest opacity-90">
                  C&amp;J Court • Official Ticket
                </span>
              </div>
              <h2 className="text-2xl font-black">{booking.courtName}</h2>
              <p className="text-xs text-white/80 font-medium">Indoor Tournament Cushion • Air Conditioned</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black uppercase bg-white/20 px-3 py-1 rounded-full border border-white/30 block print:border-black print:text-black">
                {booking.status.toUpperCase()}
              </span>
              <span className="text-[11px] text-white/90 font-mono block mt-1">
                Ref: #{booking.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          <CardContent className="p-6 md:p-8 space-y-6 print:p-4">
            
            {/* Key Reservation Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/80 p-5 rounded-2xl border border-white/10 print:bg-slate-50 print:border-slate-300">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 print:text-slate-600 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Playing Date
                </span>
                <p className="font-bold text-white text-base print:text-black">{formattedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 print:text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Session Interval
                </span>
                <p className="font-bold text-white text-base print:text-black">
                  {timeSlotRange} ({booking.durationHours} hr{booking.durationHours > 1 ? 's' : ''})
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/5 md:border-t-0 md:pt-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> Arena Location
                </span>
                <p className="text-xs font-semibold text-slate-300 print:text-black">
                  C&amp;J Court, Tomas Morato, Quezon City
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/5 md:border-t-0 md:pt-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Player Contact
                </span>
                <p className="text-xs font-semibold text-slate-300 print:text-black">
                  {booking.guestName} ({booking.guestEmail})
                </p>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-white/5 print:bg-transparent print:border-none">
              <div className="flex justify-between text-xs text-slate-300 print:text-black">
                <span>
                  {booking.courtName} ({booking.durationHours} hr{booking.durationHours > 1 ? 's' : ''})
                </span>
                <span className="font-bold text-white print:text-black">
                  ₱{booking.totalPrice.toFixed(2)}
                </span>
              </div>

              {booking.notes && (
                <div className="flex justify-between text-xs text-amber-300 print:text-slate-700">
                  <span>{booking.notes}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10 print:border-slate-300 print:text-black">
                <span>Total Amount</span>
                <span className="text-amber-400 print:text-black text-xl">
                  ₱{booking.totalPrice.toFixed(2)} {booking.currency}
                </span>
              </div>
            </div>

            {/* Fast Check-In QR Code Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#14161b] p-5 rounded-2xl border border-white/10 print:bg-white print:border-slate-300">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 print:text-black block">
                  Counter Fast Check-In
                </span>
                <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                  Present this QR code or mention Reference ID{' '}
                  <strong className="font-mono text-amber-300 print:text-black">
                    #{booking.id.slice(0, 8).toUpperCase()}
                  </strong>{' '}
                  at the C&amp;J Court reception desk upon arrival.
                </p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Payment Method: <span className="capitalize font-bold text-slate-300 print:text-black">{booking.paymentMethod}</span>
                </div>
              </div>

              {qrDataUrl ? (
                <div className="shrink-0 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-32 h-32 rounded-xl border-2 border-white shadow-md mx-auto"
                  />
                  <span className="text-[9px] font-mono text-slate-400 uppercase mt-1 block">
                    Scan for check-in
                  </span>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-slate-900 flex items-center justify-center text-xs text-slate-500">
                  Loading QR...
                </div>
              )}
            </div>

            {/* Venue Rules & Strict Cancellation Policy */}
            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-4 rounded-xl border border-white/5 print:bg-slate-50 print:text-slate-600 print:border-slate-300">
              <p className="font-bold text-red-300 print:text-red-600">
                • Strict 24-Hour Cancellation Policy:
              </p>
              <p>
                Sessions may be cancelled for a refund only if requested at least 24 hours prior to
                session start. Non-marking court shoes are required inside the facility.
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 pt-2 border-t border-white/5 print:border-slate-300 print:text-slate-500">
              <p>Thank you for choosing C&amp;J Court! Happy Dinking!</p>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          nav, header, footer, button, .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1cm;
            size: auto;
          }
        }
      `}</style>

    </div>
  );
}
