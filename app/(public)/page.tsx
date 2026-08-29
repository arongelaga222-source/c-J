import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { PickleballCourtVisualizer } from "@/components/pickleball-court-visualizer";
import { 
  ArrowRight, 
  Trophy, 
  QrCode,
  Flame,
  Sparkles,
  Activity,
  Award
} from "lucide-react";

export default function LandingPage() {
  const stats = [
    { label: "Pro Courts", value: "4 Courts", subtext: "20' × 44' Regulation" },
    { label: "The Kitchen", value: "7 Feet", subtext: "Official Non-Volley Zone" },
    { label: "Operating Hours", value: "6 AM – 11 PM", subtext: "Daily Tournament Lights" },
    { label: "Instant Lock", value: "QR Ph & Cards", subtext: "Zero Waiting Time" },
  ];

  const pickleballHighlights = [
    {
      icon: Trophy,
      title: "Championship Cushioned Flooring",
      desc: "Multi-layer 8mm polyurethane sports cushion designed to absorb shock on knees and ankles during long dinking rallies.",
      badge: "8mm Shock Absorb",
      accent: "text-red-400 bg-red-500/10 border-red-500/20"
    },
    {
      icon: Activity,
      title: "True-Bounce Non-Glare Surface",
      desc: "USAP-certified anti-skid micro-texture for crisp topspin drives, precise third-shot drops, and zero glare night play.",
      badge: "USAP Spec",
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      icon: Award,
      title: "Pro Carbon Paddle & Ball Lounge",
      desc: "Rent premium 16mm raw carbon fiber paddles and official 40-hole outdoor pickleball tubes directly at our Pro Shop.",
      badge: "Pro Gear Rental",
      accent: "text-red-400 bg-red-500/10 border-red-500/20"
    },
    {
      icon: QrCode,
      title: "Instant QR Ph & Card Lock",
      desc: "Reserve hourly court blocks, rent paddles, and receive instant digital booking receipts via GCash, Maya, and cards.",
      badge: "Instant Confirmation",
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    }
  ];

  return (
    <div className="flex-1 flex flex-col font-sans bg-[#14161b] text-slate-100 selection:bg-red-600 selection:text-white">
      
      {/* Hero Section with Glowing Red & Golden Swoosh Gradients */}
      <section className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28 px-4">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-red-600/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
          
          {/* Main Logo Display in Hero */}
          <div className="flex justify-center py-1">
            <BrandLogo size="xl" className="hover:scale-105 transition-transform duration-300 drop-shadow-2xl" />
          </div>

          {/* Pickleball Game Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-black text-amber-400 backdrop-blur-md">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            <span>0-0-2 Ready to Serve • Metro Manila&apos;s Premier Arena</span>
          </div>

          {/* Dynamic Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white">
            Play Hard. Dink Fast. <br />
            <span className="bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Dominate C&amp;J&apos;s Courts.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Four official tournament-grade 20&apos; × 44&apos; cushioned courts in Quezon City. 
            High-lux LED night lighting, carbon paddle rentals, and seamless online booking.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/book" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-8 h-14 text-base font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-xl shadow-red-600/30 rounded-2xl transition-all hover:scale-[1.02]"
              >
                Book a Court Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto px-8 h-14 text-base font-bold border-white/15 hover:bg-white/10 text-slate-200 rounded-2xl"
              >
                View Rates &amp; Memberships
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pickleball Stats Counter Strip */}
      <section className="border-y border-white/10 bg-[#181b22]/80 backdrop-blur-md py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-white">{stat.label}</div>
              <div className="text-xs text-slate-400">{stat.subtext}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Court Schematic Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-black border border-red-500/20">
            <Trophy className="w-3.5 h-3.5" /> Interactive Court Blueprint
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white">Experience The C&amp;J&apos;s Arena</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Click on any zone below (The Kitchen, Left Service, Right Service, or Net) to inspect court dimensions and pro tactical tips.
          </p>
        </div>

        {/* Live Court Interactive Diagram */}
        <PickleballCourtVisualizer />
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Built For Pure Pickleball</h2>
          <p className="text-3xl md:text-5xl font-black text-white">Why Dinkers Choose C&amp;J&apos;s</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pickleballHighlights.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="border-white/10 bg-[#1c1f26]/80 backdrop-blur-md hover:border-red-500/50 transition-all duration-300 group rounded-3xl">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${feat.accent}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#14161b] text-slate-300 border border-white/10">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
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

      {/* Ready To Play Banner */}
      <section className="max-w-5xl mx-auto px-4 mb-20 w-full">
        <div className="relative rounded-3xl overflow-hidden border border-red-500/40 bg-gradient-to-br from-[#1c1f26] via-[#1c1f26] to-red-950/60 p-10 md:p-14 text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Book Online In Under 1 Minute
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            Grab Your Paddle &amp; Step on Court!
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base">
            Evening prime-time slots fill up fast! Check live availability and secure your court today at C&amp;J&apos;s Courts.
          </p>
          <div className="pt-2">
            <Link href="/book">
              <Button size="lg" className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black px-8 h-12 shadow-lg shadow-red-600/30 rounded-xl">
                Reserve Your Court Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}