import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/actions";
import { BrandLogo } from "@/components/brand-logo";
import { ReserveCourtModal } from "@/components/reserve-court-modal";
import { PublicMobileNav } from "@/components/public-mobile-nav";
import {
  MapPin,
  Clock,
  Phone,
  Search,
  CheckCircle2,
  Calendar,
  LogOut,
  ChevronRight
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
    <div className="min-h-screen bg-white text-[#111111] flex flex-col font-sans selection:bg-[#111111] selection:text-white">
      {/* 1. Nike Utility Bar (36px Soft-Cloud Strip) */}
      <div className="bg-[#f5f5f5] text-[#111111] text-xs h-9 px-4 sm:px-8 flex items-center justify-between border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight text-[#111111]">
            C&amp;J Pickleball Arena QC
          </span>
          <span className="text-[#cacacb]">•</span>
          <span className="hidden sm:inline text-[#707072]">
            Tomas Morato, Quezon City • Daily 6:00 AM – 10:00 PM
          </span>
        </div>

        <div className="flex items-center gap-4 text-[#111111] font-medium text-[11px] sm:text-xs">
          <span className="hidden md:inline text-[#707072]">
            Fixed ₱300 / hr Flat Rate
          </span>
          <span className="hidden md:inline text-[#cacacb]">•</span>
          <Link href="/pricing" className="hover:text-[#707072] transition-colors">
            Court Specs
          </Link>
          <span className="text-[#cacacb]">•</span>
          <Link href="/book" className="hover:text-[#707072] transition-colors font-semibold">
            Live Booking
          </Link>
          <span className="text-[#cacacb]">•</span>
          {user ? (
            <Link
              href={userRole === "admin" || userRole === "owner" ? "/admin" : userRole === "cashier" ? "/cashier" : "/dashboard"}
              className="hover:text-[#707072] transition-colors font-semibold"
            >
              My Account
            </Link>
          ) : (
            <Link href="/login" className="hover:text-[#707072] transition-colors font-semibold">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* 2. Nike Primary Nav Bar (64px, White Canvas, Inset Hairline) */}
      <header className="sticky top-0 z-40 bg-white hairline-inset px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <BrandLogo size="md" withSubtitle />
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-[#111111]">
            <Link
              href="/"
              className="py-1 hover:text-[#707072] transition-colors relative"
            >
              Arena Home
            </Link>
            <Link
              href="/book"
              className="py-1 hover:text-[#707072] transition-colors flex items-center gap-1.5"
            >
              <span>Book Court</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#111111] border border-[#cacacb]">
                ₱300/HR
              </span>
            </Link>
            <Link
              href="/pricing"
              className="py-1 hover:text-[#707072] transition-colors"
            >
              Rates &amp; Gear
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Active Courts Live Signal */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f5] text-xs font-medium text-[#111111]">
            <span className="w-2 h-2 rounded-full bg-[#007d48]" />
            <span className="text-[11px] font-medium">Courts 1 &amp; 2 Open</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              {userRole === "admin" || userRole === "owner" ? (
                <Link href="/admin">
                  <Button size="sm" variant="secondary" className="text-xs px-3.5">
                    Admin
                  </Button>
                </Link>
              ) : userRole === "cashier" ? (
                <Link href="/cashier">
                  <Button size="sm" variant="secondary" className="text-xs px-3.5">
                    POS
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button size="sm" variant="secondary" className="text-xs px-3.5">
                    Pass &amp; Bookings
                  </Button>
                </Link>
              )}

              <Link href="/book">
                <Button size="sm" className="bg-[#111111] text-white hover:bg-[#222222] text-xs px-4">
                  Book Slot
                </Button>
              </Link>

              <form action={logout} className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="text-[#707072] hover:text-[#111111] text-xs"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-[#111111] text-xs font-medium">
                  Sign In
                </Button>
              </Link>
              <ReserveCourtModal
                isLoggedIn={!!user}
                buttonText="Book Court"
                triggerSize="sm"
                triggerClassName="bg-[#111111] text-white hover:bg-[#222222] text-xs px-5"
              />
            </div>
          )}

          {/* Mobile Drawer Trigger */}
          <PublicMobileNav userRole={userRole} isLoggedIn={!!user} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* 3. Nike Editorial Footer */}
      <footer className="border-t border-[#cacacb] bg-white pt-16 pb-12 px-6 sm:px-12 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <BrandLogo size="md" withSubtitle />
            <p className="text-sm text-[#707072] leading-relaxed pt-2 max-w-sm">
              Metro Manila&apos;s tournament-grade indoor pickleball arena. 
              Featuring USA Pickleball certified 8mm polyurethane cushioned courts, 
              850-lux lighting, pro carbon paddle rentals, and instant PayMongo checkout.
            </p>
          </div>

          {/* Col 2: Fast Navigation */}
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-[#111111] mb-5 uppercase">
              Court Reservations
            </h4>
            <ul className="space-y-3 text-sm text-[#707072]">
              <li>
                <Link href="/book" className="hover:text-[#111111] transition-colors">
                  Court 1 — Indoor (Pro Cushion)
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-[#111111] transition-colors">
                  Court 2 — Indoor (Tournament Spec)
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#111111] transition-colors">
                  Hourly Rates &amp; Multi-Hour Blocks
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#111111] transition-colors">
                  Pro Carbon Paddle Rentals (₱150)
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#111111] transition-colors">
                  Digital QR Pass &amp; Check-In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Specifications */}
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-[#111111] mb-5 uppercase">
              Arena Specifications
            </h4>
            <ul className="space-y-3 text-sm text-[#707072]">
              <li>Official 20&apos; × 44&apos; USAP Dimensions</li>
              <li>8mm Multi-Layer Polyurethane Cushion</li>
              <li>7-Foot Non-Volley Zone (The Kitchen)</li>
              <li>36&quot; Post / 34&quot; Center Tension Nets</li>
              <li>Air-Conditioned Indoor Lounge &amp; Lockers</li>
            </ul>
          </div>

          {/* Col 4: Location & Operating Hours */}
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-[#111111] mb-5 uppercase">
              Arena Contact
            </h4>
            <div className="space-y-3 text-sm text-[#707072]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <span>Tomas Morato Avenue, Quezon City, Metro Manila</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#111111] shrink-0" />
                <span>Open Daily: 6:00 AM – 10:00 PM</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#111111] shrink-0" />
                <span>+63 (917) 555-CJCOURT</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1px Hairline Divider */}
        <div className="border-t border-[#cacacb] pt-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-[#707072] gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#111111] font-semibold">Philippines</span>
            <span>&copy; {new Date().getFullYear()} C&amp;J Pickleball Arena Inc. All Rights Reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-[#707072]">
            <span className="text-[#007d48] font-medium">
              Strict 24-Hour Refundable Cancellation Guarantee
            </span>
            <Link href="/pricing" className="hover:text-[#111111] transition-colors">
              Rules of the Kitchen
            </Link>
            <Link href="/pricing" className="hover:text-[#111111] transition-colors">
              Terms of Service
            </Link>
            <Link href="/pricing" className="hover:text-[#111111] transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}