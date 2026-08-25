import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, MapPin, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

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
  const { data: bookings } = await supabase
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

  // 4. Process Data
  const now = new Date();
  const upcomingBookings = bookings?.filter((b) => new Date(b.start_time) > now) || [];
  const pastBookings = bookings?.filter((b) => new Date(b.start_time) <= now) || [];

  const firstName = profile?.full_name?.split(" ")[0] || "User";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  // Formatting helpers
  const formatDate = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
  const formatTime = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  const formatMemberSince = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date(dateStr));

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-10">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-emerald-100">
            <AvatarImage src="" alt={profile?.full_name || "User"} />
            <AvatarFallback className="bg-emerald-600 text-white text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{firstName}'s Dashboard</h1>
            <p className="text-slate-500">
              Member since {profile?.created_at ? formatMemberSince(profile.created_at) : "recently"}
            </p>
          </div>
        </div>
        <Link href="/book">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            Book a Court
          </Button>
        </Link>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Upcoming Bookings Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <Card key={booking.id} className="border-emerald-100 overflow-hidden">
                <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-100 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    {booking.status}
                  </span>
                  <span className="text-sm font-medium text-emerald-700">Ref: {booking.id.split('-')[0]}</span>
                </div>
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-700">
                      <CalendarDays className="mr-3 h-5 w-5 text-slate-400" />
                      <span className="font-semibold text-lg">{formatDate(booking.start_time)}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Clock className="mr-3 h-5 w-5 text-slate-400" />
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                    <div className="flex items-center text-slate-600">
                      <MapPin className="mr-3 h-5 w-5 text-slate-400" />
                      {(booking.courts as any)?.name || "Standard Court"}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="text-xl font-bold text-slate-900">₱{booking.total_amount}</div>
                    <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      Cancel Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500 mb-4">You have no upcoming court reservations.</p>
              <Link href="/book">
                <Button variant="outline">Browse Available Courts</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Past Sessions</CardTitle>
              <CardDescription>A record of your previous court bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              {pastBookings.length > 0 ? (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center p-4 rounded-lg border bg-slate-50/50">
                      <div>
                        <p className="font-medium text-slate-900">{formatDate(booking.start_time)}</p>
                        <p className="text-sm text-slate-500">
                          {(booking.courts as any)?.name || "Standard Court"} • {formatTime(booking.start_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">₱{booking.total_amount}</p>
                        <p className="text-xs text-slate-500">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No past bookings found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Update your personal information and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Full Name</p>
                  <p className="text-base text-slate-900">{profile?.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Email Address</p>
                  <p className="text-base text-slate-900">{user.email}</p>
                </div>
              </div>
              <div className="pt-6 mt-4 border-t border-slate-100 flex gap-3">
                <Button variant="outline" className="text-slate-600">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}