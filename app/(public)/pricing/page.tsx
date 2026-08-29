import Link from "next/link";
import { Check, Sparkles, Trophy, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  const tiers = [
    {
      name: "Casual Player",
      badge: "Flexible Play",
      price: "₱800",
      period: "/ hour",
      description: "Pay-as-you-play for friendly matches, weekend dinks, or occasional games.",
      icon: Zap,
      features: [
        "Standard & Outdoor court access",
        "Book up to 3 days in advance",
        "Access to air-conditioned players lounge",
        "Free locker & shower facilities",
        "Pro Shop gear rental available"
      ],
      cta: "Book Single Court Session",
      href: "/book",
      highlighted: false,
    },
    {
      name: "C&J Club Member",
      badge: "Most Popular",
      price: "₱3,500",
      period: "/ month",
      description: "For active enthusiasts who want priority booking, discounted rates, and gear perks.",
      icon: Trophy,
      features: [
        "4 hours of complimentary court time / mo",
        "Discounted additional hours (₱600/hr)",
        "Priority 14-day advance booking window",
        "Unlimited free carbon paddle rentals",
        "10% discount on Pro Shop beverages & gear",
        "Invitations to monthly C&J club tournaments"
      ],
      cta: "Join C&J Club Membership",
      href: "/signup",
      highlighted: true,
    },
    {
      name: "C&J Pro Tour Squad",
      badge: "Championship",
      price: "₱6,500",
      period: "/ month",
      description: "For tournament competitors, teams, and daily trainers demanding the best.",
      icon: Shield,
      features: [
        "10 hours of complimentary court time / mo",
        "Fixed prime-time slot reservations",
        "30-day advance booking window",
        "2 Guest passes included per month",
        "Free ball machine access (1 hr / week)",
        "20% discount across all Pro Shop merchandise"
      ],
      cta: "Get Pro Tour Access",
      href: "/signup",
      highlighted: false,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-16 md:py-24 font-sans">
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-black text-amber-400">
          <Sparkles className="w-3.5 h-3.5" /> Transparent Court Rates • Zero Hidden Fees
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          Court Rates &amp; Memberships
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
          Whether you want a casual 1-hour weekend smash or priority prime-time slots with free carbon paddle rentals at C&amp;J&apos;s Courts.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card
              key={tier.name}
              className={`flex flex-col relative rounded-3xl transition-all duration-300 ${
                tier.highlighted
                  ? "border-red-500 bg-gradient-to-b from-slate-900 via-slate-900 to-red-950/40 shadow-2xl shadow-red-500/20 scale-[1.03] z-10"
                  : "border-slate-800 bg-slate-900/70 backdrop-blur-md hover:border-slate-700"
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
                  tier.highlighted ? "bg-red-500/20 text-amber-400 border border-red-500/40" : "bg-slate-800 text-slate-300 border border-slate-700"
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
                <div className="border-t border-slate-800 pt-6 space-y-3.5">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs font-semibold text-slate-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        tier.highlighted ? "bg-red-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
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
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
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
    </div>
  );
}