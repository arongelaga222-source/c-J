import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ScheduleClient from "./schedule-client";

interface RawBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
  courts: { id: string; name: string } | { id: string; name: string }[] | null;
}

export default async function CashierSchedulePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: rawBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      status,
      profiles ( full_name ),
      courts ( id, name )
    `)
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true });

  const typedRaw = (rawBookings as unknown as RawBooking[]) || [];

  const formattedBookings = typedRaw.map((booking) => ({
    id: booking.id,
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: booking.status,
    profiles: Array.isArray(booking.profiles) ? booking.profiles[0] : (booking.profiles || { full_name: "Walk-in Guest" }),
    courts: Array.isArray(booking.courts) ? booking.courts[0] : (booking.courts || { id: "", name: "Standard Court" }),
  }));

  return (
    <ScheduleClient 
      todaysBookings={formattedBookings} 
      courts={courts || []}
    />
  );
}