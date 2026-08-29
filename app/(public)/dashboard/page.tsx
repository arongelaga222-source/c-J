import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, MapPin, Trophy, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

interface CourtInfo {
  name?: string;
}

interface BookingRecord {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  courts: CourtInfo | CourtInfo[] | null;
}

export default async function UserDashboard() {
  const supabase = await createClient();

  // 1. Fetch current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", user.id)
    .single();

  // 3. Fetch Bookings
  const { data: rawBookings } = await supabase
    .from("bookings")
    .select(`
      id,
      start_time,
      end_time,
      status,
      total_amount,
      courts ( name )
    `)
    .eq("customer_id", user.id)
    .order("start_time", { ascending: false });

  const bookings = (rawBookings as unknown as BookingRecord[]) || [];

  // 4. Process Data
  const now = new Date();
  const upcomingBookings = bookings.filter((b) => new Date(b.start_time) > now);
  const pastBookings = bookings.filter((b) => new Date(b.start_time) <= now);

  const firstName = profile?.full_name?.split(" ")[0] || "Player";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "P";

  // Formatting helpers
  const formatDate = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
  const formatTime = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  const formatMemberSince = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date(dateStr));

  const getCourtName = (courts: CourtInfo | CourtInfo[] | null) => {
    if (Array.isArray(courts)) {
      return courts[0]?.name || "Standard Court";
    }
    return courts?.name || "Standard Court";
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-10 space-y-8 font-sans text-slate-100">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-red-500/50 shadow-lg shadow-red-500/20">
            <AvatarImage src="" alt={profile?.full_name || "Player"} />
            <AvatarFallback className="bg-gradient-to-tr from-red-600 to-amber-400 text-white font-black text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white">{firstName}&apos;s Portal</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                C&amp;J&apos;s Player
              </span>
            </div>
            <p className="text-xs text-slate-400">
              C&amp;J&apos;s Courts Member since {profile?.created_at ? formatMemberSince(profile.created_at) : "recently"}
            </p>
          </div>
        </div>
        <Link href="/book">
          <Button className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black px-6 h-11 shadow-lg shadow-red-500/20 rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" /> Book a Court
          </Button>
        </Link>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <TabsTrigger value="upcoming" className="rounded-xl text-xs font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-amber-500 data-[state=active]:text-white">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl text-xs font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-amber-500 data-[state=active]:text-white">
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl text-xs font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-amber-500 data-[state=active]:text-white">
            Profile
          </TabsTrigger>
        </TabsList>
        
        {/* Upcoming Bookings Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <Card key={booking.id} className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {booking.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Ref: #{booking.id.split('-')[0]}</span>
                </div>
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center text-white text-base font-bold">
                      <CalendarDays className="mr-2.5 h-4 w-4 text-amber-400" />
                      <span>{formatDate(booking.start_time)}</span>
                    </div>
                    <div className="flex items-center text-slate-300 text-xs">
                      <Clock className="mr-2.5 h-4 w-4 text-red-400" />
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                    <div className="flex items-center text-slate-400 text-xs">
                      <MapPin className="mr-2.5 h-4 w-4 text-amber-400" />
                      {getCourtName(booking.courts)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="text-2xl font-black text-amber-400">₱{booking.total_amount}</div>
                    <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-950/40 border-red-500/30 text-xs rounded-xl">
                      Cancel Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-4">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <p className="text-base font-bold text-white">No upcoming court reservations</p>
                <p className="text-xs text-slate-400">Ready to play? Reserve a 1-hour court slot today at C&amp;J&apos;s.</p>
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
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Past Play History</CardTitle>
              <CardDescription className="text-xs text-slate-400">A record of your previous court sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              {pastBookings.length > 0 ? (
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                      <div>
                        <p className="font-bold text-white text-sm">{formatDate(booking.start_time)}</p>
                        <p className="text-xs text-slate-400">
                          {getCourtName(booking.courts)} • {formatTime(booking.start_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-amber-400">₱{booking.total_amount}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">{booking.status}</p>
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

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Account Details</CardTitle>
              <CardDescription className="text-xs text-slate-400">Your profile information and membership credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs font-bold text-slate-400">Full Name</p>
                  <p className="text-sm font-bold text-white">{profile?.full_name}</p>
                </div>
                <div className="space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs font-bold text-slate-400">Email Address</p>
                  <p className="text-sm font-bold text-white">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}