import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/actions";
import { BrandLogo } from "@/components/brand-logo";
import { ReserveCourtModal } from "@/components/reserve-court-modal";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Share2, 
  Flame, 
  Sparkles, 
  Trophy, 
  Calendar,
  Activity,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole = "client";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || "client";
  }

  return (
    <div className="min-h-screen bg-[#0f1218] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Background Stadium Court Atmosphere */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transform-gpu opacity-15 filter contrast-125 saturate-125 brightness-90"
          style={{ backgroundImage: "url('/cj-court-bg.jpg')" }}
        />
        {/* Dark Stadium Vignette & Glows */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1218]/90 via-[#0f1218]/80 to-[#0f1218]/98" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-red-600/15 via-[#d4ff00]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-[-100px] w-[500px] h-[500px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 left-[-100px] w-[500px] h-[500px] bg-[#d4ff00]/10 blur-[150px] rounded-full pointer-events-none" />
      </div>

      {/* Top Athletic Pickleball Marquee Ticker */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-[#d4ff00] text-slate-950 text-xs font-black py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-black/20 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
          </span>
          <span className="uppercase tracking-wider">C&amp;J Pickleball Arena QC</span>
        </div>
        <span className="text-slate-950/40 hidden sm:inline">•</span>
        <span className="hidden sm:inline font-bold">2 Cushioned Indoor Courts Open Daily 6:00 AM – 10:00 PM</span>
        <span className="text-slate-950/40 hidden md:inline">•</span>
        <span className="hidden md:inline font-black text-red-950 bg-white/40 px-2 py-0.5 rounded-full text-[11px]">
          Fixed ₱300 / hr Flat Rate
        </span>
        <Link 
          href="/book" 
          className="ml-auto sm:ml-0 underline font-black hover:text-white transition-colors flex items-center gap-1 shrink-0"
        >
          Book Live Slots &rarr;
        </Link>
      </div>

      {/* Glassmorphism Header */}
      <header className="border-b border-white/10 bg-[#171b24]/85 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md shadow-black/20">
        <div className="flex items-center space-x-8">
          {/* Logo unchanged */}
          <Link href="/" className="flex items-center group">
            <BrandLogo size="sm" className="group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Arena Home
            </Link>
            <Link
              href="/book"
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600/20 to-amber-500/20 border border-red-500/30 hover:border-red-500/60 transition-all flex items-center gap-2 shadow-sm"
            >
              <span>Book Court</span>
              <span className="px-1.5 py-0.5 text-[9px] font-black bg-[#d4ff00] text-slate-950 rounded-md">
                ₱300/HR
              </span>
            </Link>
            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Rates &amp; Gear
            </Link>
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Quick Court Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-[11px] text-white">Courts 1 &amp; 2 Active</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              {userRole === "admin" || userRole === "owner" ? (
                <Link href="/admin">
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-md rounded-xl text-xs">
                    Admin Center
                  </Button>
                </Link>
              ) : userRole === "cashier" ? (
                <Link href="/cashier">
                  <Button size="sm" className="bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black shadow-md rounded-xl text-xs">
                    POS Terminal
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button size="sm" variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-950/50 rounded-xl font-bold text-xs">
                    My Bookings
                  </Button>
                </Link>
              )}

              <form action={logout}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl text-xs font-semibold"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-bold text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" variant="outline" className="border-[#d4ff00]/40 text-[#d4ff00] hover:bg-[#d4ff00]/10 hover:border-[#d4ff00] rounded-xl font-bold text-xs transition-colors">
                  Sign Up
                </Button>
              </Link>
              <ReserveCourtModal
                isLoggedIn={!!user}
                buttonText="Book Court"
                triggerSize="sm"
                triggerClassName="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black shadow-lg shadow-red-600/30 rounded-xl px-4 text-xs"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Modern Stadium Footer */}
      <footer className="border-t border-white/10 bg-[#12151d] pt-14 pb-10 px-6 mt-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4 md:col-span-1">
            <BrandLogo size="sm" withSubtitle />
            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Quezon City&apos;s premier indoor pickleball destination. USA Pickleball spec 8mm cushioned courts, 850-lux lighting, carbon paddle rentals, and seamless PayMongo booking.
            </p>
            <div className="flex items-center space-x-3 text-slate-400 pt-1">
              <a href="#" aria-label="Location" className="hover:text-amber-400 transition-colors p-2 rounded-xl bg-slate-800/60 border border-white/5">
                <MapPin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Social" className="hover:text-red-400 transition-colors p-2 rounded-xl bg-slate-800/60 border border-white/5">
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d4ff00] mb-4 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Fast Booking
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li><Link href="/book" className="hover:text-white transition-colors">Book Court 1 (Indoor Pro)</Link></li>
              <li><Link href="/book" className="hover:text-white transition-colors">Book Court 2 (Indoor Standard)</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Rates &amp; Gear Rental (₱150)</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Player Pass &amp; Check-In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d4ff00] mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Court Specs
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li>• Official 20&apos; × 44&apos; USAP Dimensions</li>
              <li>• 8mm Multi-Layer Polyurethane Cushion</li>
              <li>• 7-Foot Non-Volley Zone (The Kitchen)</li>
              <li>• 36&quot; Post / 34&quot; Center Championship Nets</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#d4ff00] mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Arena Location
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>C&amp;J&apos;s Courts Arena, Tomas Morato, Quezon City</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Daily: 6:00 AM – 10:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-400 shrink-0" />
                <span>+63 (917) 555-CJCOURT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} C&amp;J&apos;s Courts. Built for the Pickleball Community.</p>
          <div className="flex space-x-6">
            <span className="text-slate-400">Strict 24-Hour Refundable Cancellation Policy</span>
            <Link href="/pricing" className="hover:text-slate-300">Rules of the Kitchen</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}