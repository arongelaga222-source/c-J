import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/actions";
import { BrandLogo } from "@/components/brand-logo";
import { MapPin, Clock, Phone, Globe, Share2, Flame } from "lucide-react";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole = "customer";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || "customer";
  }

  return (
    <div className="min-h-screen bg-[#14161b] text-slate-100 flex flex-col selection:bg-red-600 selection:text-white font-sans">
      {/* Top Athletic Announcement Bar */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-slate-950 text-xs font-black py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-md">
        <Flame className="w-4 h-4 text-slate-950 animate-bounce" />
        <span>Welcome to C&amp;J&apos;s Courts! Tournament lighting and Pro Shop open until 11:00 PM!</span>
        <Link href="/book" className="underline font-black hover:text-white ml-1.5 transition-colors">
          Book Court &rarr;
        </Link>
      </div>

      {/* Glassmorphism Header with C&J's Courts Brand Logo */}
      <header className="border-b border-white/10 bg-[#1c1f26]/90 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center group">
            <BrandLogo size="sm" className="group-hover:scale-105 transition-transform" />
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              Home
            </Link>
            <Link
              href="/book"
              className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
            >
              Book a Court
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-red-500/20 text-red-400 rounded-md border border-red-500/30">
                Live
              </span>
            </Link>
            <Link
              href="/pricing"
              className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              Rates &amp; Membership
            </Link>
          </nav>
        </div>

        {/* Dynamic Auth Buttons */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center gap-2">
              {userRole === "admin" ? (
                <Link href="/admin">
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-md rounded-xl">
                    Admin Center
                  </Button>
                </Link>
              ) : userRole === "cashier" ? (
                <Link href="/cashier">
                  <Button size="sm" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-black shadow-md rounded-xl">
                    POS Terminal
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button size="sm" variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-950/50 rounded-xl font-bold">
                    My Bookings
                  </Button>
                </Link>
              )}

              <form action={logout}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-bold">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-black shadow-lg shadow-red-500/20 rounded-xl px-4">
                  Join C&amp;J&apos;s
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Modern C&J's Courts Footer */}
      <footer className="border-t border-white/10 bg-[#1c1f26]/90 backdrop-blur-md pt-12 pb-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-4">
            <BrandLogo size="sm" withSubtitle />
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              Metro Manila&apos;s ultimate pickleball destination. Tournament-grade cushioned surfaces, pro paddle lounge, and energetic community play.
            </p>
            <div className="flex items-center space-x-3 text-slate-400 pt-1">
              <a href="#" aria-label="Website" className="hover:text-amber-400 transition-colors p-2 rounded-xl bg-slate-800/60 border border-slate-800">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Share" className="hover:text-red-400 transition-colors p-2 rounded-xl bg-slate-800/60 border border-slate-800">
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li><Link href="/book" className="hover:text-white transition-colors">Book Court Online</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Rates &amp; Memberships</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Player &amp; Staff Login</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Create Free Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">Club Amenities</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li>• 4 Professional Cushioned Courts</li>
              <li>• Air-Conditioned Pro Lounge &amp; Bar</li>
              <li>• Pro Carbon Paddle &amp; Gear Rentals</li>
              <li>• High-Lux Tournament Night Lighting</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">Arena Information</h4>
            <div className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>C&amp;J&apos;s Courts Arena, Tomas Morato, Quezon City</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mon – Sun: 6:00 AM – 11:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-400 shrink-0" />
                <span>+63 (917) 555-CJCOURT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} C&amp;J&apos;s Courts. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-400">Court Rules</a>
            <a href="#" className="hover:text-slate-400">Cancellation Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}