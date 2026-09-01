import Link from "next/link";
import { Check, Sparkles, Trophy, Zap, Shield, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  const tiers = [
    {
      name: "Hourly Court Rental",
      badge: "Fixed Flat Rate",
      price: "₱300",
      period: "/ hour",
      description: "Fixed flat rate per hour for Court 1 - Indoor or Court 2 - Indoor.",
      icon: Zap,
      features: [
        "Official tournament-grade 8mm cushioned court",
        "Air-conditioned indoor arena",
        "Book single or multi-hour contiguous slots",
        "Access to player lounge & locker facilities",
        "PayMongo instant lock (GCash, Maya, Cards)",
        "Strict 24-hour refundable cancellation"
      ],
      cta: "Book Court (₱300/hr)",
      href: "/book",
      highlighted: true,
    },
    {
      name: "Pro Carbon Gear Add-On",
      badge: "Pro Equipment",
      price: "₱150",
      period: "/ session",
      description: "Rental gear bundle for casual players and tournament match play.",
      icon: Trophy,
      features: [
        "2 × 16mm Raw Carbon Fiber Paddles",
        "3 × Franklin X-40 Tournament Balls",
        "Free paddle grip wipe & towel service",
        "Selectable during online booking checkout",
        "Pick up directly at Pro Shop counter"
      ],
      cta: "Add with Court Booking",
      href: "/book",
      highlighted: false,
    },
    {
      name: "Squad / League Block",
      badge: "Multi-Hour",
      price: "₱300",
      period: "/ hr / court",
      description: "Book 3+ contiguous hours for team training, round-robin, and leagues.",
      icon: Shield,
      features: [
        "Continuous slot locking without interruption",
        "Courts 1 & 2 side-by-side availability",
        "High-lux 850 LED tournament lighting",
        "Digital PDF / Printable receipts for teams",
        "Fast counter QR check-in"
      ],
      cta: "Reserve League Block",
      href: "/book",
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: "What is your cancellation and refund policy?",
      a: "Bookings cancelled at least 24 hours prior to your scheduled start time receive a full refund processed back to your original payment method. Cancellations within 24 hours are non-refundable."
    },
    {
      q: "What footwear is required on court?",
      a: "Non-marking athletic or court shoes are strictly required to preserve the 8mm cushioned polyurethane floor surface."
    },
    {
      q: "Do I need to bring my own paddles and balls?",
      a: "You can bring your own gear or rent our Pro Carbon Fiber bundle (2x 16mm raw carbon paddles + 3x tournament balls) for only ₱150 during checkout or at the Pro Shop counter."
    },
    {
      q: "Can I book multiple consecutive hours?",
      a: "Yes! Our live booking system allows you to select 1, 2, 3, or 4 contiguous hour blocks to ensure your game continues uninterrupted."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-14 md:py-20 font-sans">
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d4ff00]/30 bg-[#d4ff00]/10 px-4 py-1 text-xs font-black text-[#d4ff00]">
          <Sparkles className="w-3.5 h-3.5" /> Simple &amp; Transparent • Fixed ₱300/hr Flat Rate
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          Court Rates &amp; Gear Rentals
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
          No hidden fees or surge pricing. Enjoy tournament-grade indoor cushioned courts at C&amp;J Court for a fixed ₱300/hr rate.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card
              key={tier.name}
              className={`flex flex-col relative rounded-3xl transition-all duration-300 ${
                tier.highlighted
                  ? "border-red-500 bg-gradient-to-b from-[#1a1f2c] via-[#171b24] to-red-950/40 shadow-2xl shadow-red-500/20 scale-[1.03] z-10"
                  : "border-white/10 bg-[#171b24]/80 backdrop-blur-md hover:border-white/20"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg shadow-red-500/30">
                    {tier.badge}
                  </span>
                </div>
              )}

              <CardHeader className="p-8 pb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  tier.highlighted ? "bg-red-500/20 text-[#d4ff00] border border-red-500/40" : "bg-slate-800 text-slate-300 border border-white/5"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl font-black text-white">{tier.name}</CardTitle>
                <CardDescription className="text-xs text-slate-400 min-h-[40px] pt-1">
                  {tier.description}
                </CardDescription>

                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl md:text-5xl font-black text-white">{tier.price}</span>
                  <span className="ml-2 text-sm font-bold text-slate-400">{tier.period}</span>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-4 flex-1">
                <div className="border-t border-white/10 pt-6 space-y-3.5">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs font-semibold text-slate-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        tier.highlighted ? "bg-red-500/20 text-[#d4ff00]" : "bg-slate-800 text-slate-400"
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Link href={tier.href} className="w-full">
                  <Button
                    size="lg"
                    className={`w-full h-12 font-black rounded-xl ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/30"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-4xl mx-auto space-y-8 pt-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black border border-amber-500/30">
            <HelpCircle className="w-3.5 h-3.5" /> Player FAQs
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white">Got Questions About Booking?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#171b24]/90 border border-white/10 space-y-2">
              <h3 className="text-sm font-bold text-[#d4ff00] flex items-center gap-2">
                <span>•</span> {faq.q}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed pl-3.5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}