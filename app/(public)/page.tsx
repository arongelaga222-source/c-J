import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { PickleballCourtVisualizer } from "@/components/pickleball-court-visualizer";
import { ReserveCourtModal } from "@/components/reserve-court-modal";
import { createClient } from "@/utils/supabase/server";
import { 
  ArrowRight, 
  Trophy, 
  QrCode, 
  Flame, 
  Sparkles, 
  Activity, 
  Award,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Shield,
  Star
} from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const arenaStats = [
    { label: "Indoor Pro Courts", value: "2 Courts", subtext: "Court 1 & Court 2 Indoor" },
    { label: "Fixed Flat Rate", value: "₱300 / hr", subtext: "Zero Surge • Zero Hidden Fees" },
    { label: "Operating Hours", value: "6 AM – 10 PM", subtext: "Air-Conditioned Daily Play" },
    { label: "Instant Payment", value: "PayMongo", subtext: "GCash, Maya, QR Ph, & Cards" },
  ];

  const pickleballHighlights = [
    {
      icon: Trophy,
      title: "Championship 8mm Cushioned Flooring",
      desc: "Multi-layer polyurethane sports cushion designed specifically to absorb shock on knees and lower back during fast kitchen dinking rallies and baseline drives.",
      badge: "8mm Shock Pad",
      accent: "text-red-400 bg-red-500/10 border-red-500/30"
    },
    {
      icon: Activity,
      title: "USA Pickleball Specification Courts",
      desc: "True-bounce, non-skid, glare-free surface with official 20' × 44' dimensions, crisp 2-inch court lines, and high-lux 850 LED tournament lighting.",
      badge: "USAP Standard",
      accent: "text-[#d4ff00] bg-[#d4ff00]/10 border-[#d4ff00]/30"
    },
    {
      icon: Award,
      title: "Pro Carbon Paddle & Ball Rentals",
      desc: "Rent high-performance 16mm raw carbon fiber paddles and official 40-hole outdoor pickleball balls directly at our Pro Shop for only ₱150 per session.",
      badge: "Pro Gear ₱150",
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/30"
    },
    {
      icon: QrCode,
      title: "Instant PayMongo Digital Reservation",
      desc: "Check real-time court availability, book single or contiguous multi-hour slots, and get instant QR confirmation with GCash, Maya, and credit cards.",
      badge: "Instant Lock",
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    }
  ];

  const matchSessions = [
    {
      time: "06:00 AM – 10:00 AM",
      title: "Early Bird Dink & Rally",
      type: "Open Play / Friendly",
      desc: "Start your morning with energetic singles and doubles rallies. Great for endurance training.",
      badge: "Morning Session",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30"
    },
    {
      time: "10:00 AM – 05:00 PM",
      title: "Peak Hourly Bookings & Practice",
      type: "Court Rental",
      desc: "Book Court 1 or Court 2 for private team training, family games, or casual social matches.",
      badge: "Available Now",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    },
    {
      time: "05:00 PM – 10:00 PM",
      title: "Prime Night Lights & Shootouts",
      type: "High-Energy Play",
      desc: "High-intensity games under full 850-lux stadium floodlights. Fast rallies and tournament vibes.",
      badge: "Prime Hours",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30"
    }
  ];

  const testimonials = [
    {
      name: "Marcus Villanueva",
      role: "DUPR 4.2 Tournament Player",
      comment: "The 8mm cushion flooring at C&J makes a massive difference. You can play 3 hours of intense pickleball without the knee pain you get on concrete courts.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Weekend Doubles Enthusiast",
      comment: "Booking via GCash is so smooth. You pick your court, pay through PayMongo, and your slot is instantly reserved. The pro carbon paddles are top-tier too!",
      rating: 5
    },
    {
      name: "Coach Dave Ramos",
      role: "Pickleball Academy Lead",
      comment: "Best indoor lighting in Quezon City. Crisp court contrast, true ball bounce, and genuine 20'x44' USAP dimensions. Perfect venue for clinics and team matches.",
      rating: 5
    }
  ];

  return (
    <div className="flex-1 flex flex-col font-sans text-slate-100 selection:bg-red-600 selection:text-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 px-4">
        {/* Ambient Stadium Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-red-600/15 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[380px] h-[380px] bg-[#d4ff00]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-7 relative z-10">
          
          {/* Logo unchanged */}
          <div className="flex justify-center py-1">
            <BrandLogo size="xl" className="hover:scale-105 transition-transform duration-300 drop-shadow-2xl" />
          </div>

          {/* Athletic Scoreboard Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4ff00]/30 bg-[#d4ff00]/10 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-black text-[#d4ff00] backdrop-blur-md shadow-sm max-w-full">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 animate-pulse shrink-0" />
            <span className="tracking-wide uppercase truncate sm:whitespace-normal">0-0-2 Ready to Serve • Metro Manila&apos;s Premier Arena</span>
          </div>

          {/* Kinetic Headline */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white">
            Play Hard. Dink Fast. <br />
            <span className="bg-gradient-to-r from-red-500 via-amber-400 to-[#d4ff00] bg-clip-text text-transparent">
              Dominate C&amp;J Courts.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Two official tournament-grade indoor cushioned courts in Quezon City. 
            Fixed <span className="text-[#d4ff00] font-black">₱300/hr</span> flat rate, air-conditioned player lounge, and instant PayMongo reservation.
          </p>

          {/* Main Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <ReserveCourtModal
              isLoggedIn={!!user}
              buttonText="Reserve Court (₱300 / hr)"
              triggerSize="lg"
              triggerClassName="w-full sm:w-auto px-6 sm:px-9 h-12 sm:h-14 text-sm sm:text-base font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-xl shadow-red-600/30 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            />
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base font-bold border-white/20 hover:bg-white/10 text-slate-200 rounded-2xl backdrop-blur-md"
              >
                View Rates &amp; Rentals
              </Button>
            </Link>
          </div>

          {/* Court Showcase Card */}
          <div className="pt-6 max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-[#171b24]/90 to-[#0f1218]/95 shadow-2xl p-2.5 sm:p-3.5 backdrop-blur-xl group hover:border-[#d4ff00]/40 transition-all duration-500">
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden">
                <Image
                  src="/cj-court-bg.jpg"
                  alt="C&J Pickleball Indoor Arena Court"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-95 contrast-110"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1218] via-[#0f1218]/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f1218]/70 via-transparent to-[#0f1218]/70" />

                {/* Floating Arena Badges */}
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 flex flex-wrap gap-2 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black bg-[#0f1218]/90 backdrop-blur-md text-[#d4ff00] border border-[#d4ff00]/30 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Tomas Morato, QC • Live Booking
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#0f1218]/90 backdrop-blur-md text-slate-200 border border-white/15 shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-400" /> Court 1 &amp; Court 2 Indoor
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 flex items-end justify-between gap-2 z-10">
                  <div className="text-left">
                    <p className="text-[11px] sm:text-sm font-black text-white drop-shadow-md flex flex-wrap items-center gap-1 sm:gap-2">
                      <span>Tournament 8mm Floor</span>
                      <span className="text-[#d4ff00] hidden sm:inline">•</span>
                      <span className="hidden sm:inline">850-Lux LED Floodlights</span>
                    </p>
                    <p className="text-[9px] sm:text-xs text-slate-300 drop-shadow line-clamp-1">
                      Official 20&apos; × 44&apos; USAP Specification Surface
                    </p>
                  </div>
                  <Link href="/book">
                    <Button size="sm" className="hidden sm:flex bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-lg">
                      Book Slot Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-white/10 bg-[#141822]/80 backdrop-blur-md py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {arenaStats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-500 via-amber-400 to-[#d4ff00] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-white">{stat.label}</div>
              <div className="text-xs text-slate-400">{stat.subtext}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Court Blueprint Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-black border border-red-500/30">
            <Trophy className="w-3.5 h-3.5" /> Interactive Court Blueprint
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white">Experience The C&amp;J Court Layout</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Click on any zone below (The Kitchen, Left Service, Right Service, or Net) to inspect official court dimensions and pro tactical tips.
          </p>
        </div>

        <PickleballCourtVisualizer />
      </section>

      {/* Daily Sessions & Match Play Schedule */}
      <section className="max-w-6xl mx-auto px-4 pb-20 w-full">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d4ff00]/10 text-[#d4ff00] text-xs font-black border border-[#d4ff00]/30">
            <Clock className="w-3.5 h-3.5" /> Daily Arena Schedule
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white">Play Anytime From Morning to Night</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Open daily for social matches, singles drills, doubles round-robins, and private team blocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matchSessions.map((session, idx) => (
            <div 
              key={idx} 
              className="p-6 rounded-3xl bg-[#171b24]/80 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-4 relative group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${session.badgeColor}`}>
                  {session.badge}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {session.time}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#d4ff00] transition-colors">
                {session.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {session.desc}
              </p>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Rate: ₱300 / hr</span>
                <Link href="/book" className="text-xs font-black text-[#d4ff00] hover:underline flex items-center gap-1">
                  Select Time &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#d4ff00]">Engineered For Pure Pickleball</h2>
          <p className="text-3xl md:text-5xl font-black text-white">Why Players Choose C&amp;J Court</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pickleballHighlights.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="border-white/10 bg-[#171b24]/80 backdrop-blur-md hover:border-red-500/50 transition-all duration-300 group rounded-3xl">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${feat.accent}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#0f1218] text-slate-300 border border-white/10">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#d4ff00] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Community Testimonials */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black border border-amber-500/30">
            <Users className="w-3.5 h-3.5" /> Player Community
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white">What Players Say About C&amp;J</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-3xl bg-[#171b24]/90 border border-white/10 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <p className="text-[11px] text-[#d4ff00] font-semibold">{t.role}</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs">
                  {t.name[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 mb-20 w-full">
        <div className="relative rounded-3xl overflow-hidden border border-red-500/40 bg-gradient-to-br from-[#171b24] via-[#171b24] to-red-950/60 p-10 md:p-14 text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d4ff00]/20 text-[#d4ff00] text-xs font-black border border-[#d4ff00]/40">
            <Sparkles className="w-3.5 h-3.5" /> Book Online In Under 1 Minute
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            Grab Your Paddle &amp; Step on Court!
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base">
            Fixed ₱300 per hour flat rate for Court 1 &amp; Court 2 Indoor. Check real-time availability and lock your session today.
          </p>
          <div className="pt-2">
            <ReserveCourtModal
              isLoggedIn={!!user}
              buttonText="Reserve Your Court Now (₱300/hr)"
              triggerSize="lg"
              triggerClassName="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black px-8 h-12 shadow-lg shadow-red-600/30 rounded-xl"
            />
          </div>
        </div>
      </section>

    </div>
  );
}