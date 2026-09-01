import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createPayMongoCheckoutSession } from '@/lib/paymongo';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courtId,
      date, // YYYY-MM-DD
      timeSlot, // e.g. "07:00 AM" or hour24
      hour24, // e.g. 7
      durationHours = 1,
      guestName,
      guestEmail,
      guestPhone,
      paddleRental = false,
    } = body;

    if (!courtId || !date || (hour24 === undefined && !timeSlot)) {
      return NextResponse.json(
        { error: 'Missing required booking parameters (courtId, date, timeSlot).' },
        { status: 400 }
      );
    }

    if (!guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Please provide your full name and email address.' },
        { status: 400 }
      );
    }

    const duration = Math.max(1, parseInt(String(durationHours), 10));
    const startHour = hour24 !== undefined ? parseInt(String(hour24), 10) : parseHourFromSlot(timeSlot);

    // Calculate Start Time and End Time in Philippine Time (+08:00)
    const startTime = new Date(`${date}T${startHour.toString().padStart(2, '0')}:00:00.000+08:00`);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    // Check if start time is in the past
    if (startTime.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Selected time slot has already passed. Please select a future time.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch Court Info & Hourly Rate
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (courtError || !court) {
      return NextResponse.json({ error: 'Selected court not found or inactive.' }, { status: 404 });
    }

    // 2. Check for Overlapping Active/Locked Bookings
    const nowUtc = new Date();
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('id, status, expires_at')
      .eq('court_id', court.id)
      .in('status', ['paid', 'checked_in', 'walk_in', 'pending_payment'])
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString());

    if (overlapError) {
      console.error('Error checking overlap:', overlapError);
      return NextResponse.json({ error: 'Failed to verify slot availability.' }, { status: 500 });
    }

    const activeConflict = (overlappingBookings || []).find((b) => {
      if (b.status === 'pending_payment') {
        return b.expires_at ? new Date(b.expires_at) > nowUtc : false;
      }
      return true;
    });

    if (activeConflict) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please select another slot.' },
        { status: 409 }
      );
    }

    // 3. Authenticated User (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 4. Calculate Total Price (court rate * duration + optional paddle rental)
    const hourlyRate = court.hourly_rate !== undefined && court.hourly_rate !== null ? Number(court.hourly_rate) : 1;
    const courtPrice = hourlyRate * duration;
    const paddlePrice = paddleRental ? 150 : 0;
    const totalPrice = courtPrice + paddlePrice;

    // 5-Minute temporary reservation lock
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const originUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const formattedSlot = `${startHour % 12 === 0 ? 12 : startHour % 12}:00 ${startHour >= 12 ? 'PM' : 'AM'}`;

    // Standard Pay-First Policy: PayMongo Hosted Checkout Session (GCash / Maya / Cards / QR Ph)
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        court_id: court.id,
        user_id: user ? user.id : null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_hours: duration,
        total_price: totalPrice,
        total_amount: totalPrice,
        currency: 'PHP',
        status: 'pending_payment',
        payment_method: 'paymongo',
        expires_at: expiresAt.toISOString(),
        notes: paddleRental ? 'Includes Pro Paddle Rental (+₱150)' : null,
      })
      .select('id')
      .single();

    if (insertError || !booking) {
      console.error('Failed to create pending booking:', insertError);
      return NextResponse.json(
        { error: 'Failed to create reservation lock. Slot may have just been taken.' },
        { status: 409 }
      );
    }

    const { checkoutUrl, sessionId } = await createPayMongoCheckoutSession({
      bookingId: booking.id,
      courtName: court.name,
      durationHours: duration,
      totalPrice,
      customerName: guestName,
      customerEmail: guestEmail,
      customerPhone: guestPhone,
      dateStr: date,
      timeSlot: formattedSlot,
      originUrl,
    });

    // Update booking with PayMongo session ID
    await supabase
      .from('bookings')
      .update({ paymongo_checkout_session_id: sessionId })
      .eq('id', booking.id);

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      checkoutUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Checkout error:', errorMsg);
    return NextResponse.json({ error: errorMsg || 'Checkout initialization failed.' }, { status: 500 });
  }
}

function parseHourFromSlot(slotStr: string): number {
  const match = slotStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 7;
  let h = parseInt(match[1], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h;
}
