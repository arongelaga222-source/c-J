import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ScheduleClient from "./schedule-client";

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

  const formattedBookings = rawBookings?.map((booking: any) => ({
    id: booking.id,
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: booking.status,
    profiles: Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles,
    courts: Array.isArray(booking.courts) ? booking.courts[0] : booking.courts,
  })) || [];

  return (
    <ScheduleClient 
      todaysBookings={formattedBookings} 
      courts={courts || []}
    />
  );
}