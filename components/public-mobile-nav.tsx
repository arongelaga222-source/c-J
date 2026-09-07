'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Calendar, ArrowRight, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/actions';
import { BrandLogo } from '@/components/brand-logo';

interface PublicMobileNavProps {
  userRole?: string;
  isLoggedIn: boolean;
}

export function PublicMobileNav({ userRole, isLoggedIn }: PublicMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-[#111111] hover:bg-[#f5f5f5] transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 top-[60px] z-50 bg-white border-t border-[#cacacb] flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#cacacb]">
              <BrandLogo size="sm" withSubtitle />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-[#f5f5f5]"
              >
                <X className="w-5 h-5 text-[#111111]" />
              </button>
            </div>

            <nav className="space-y-4">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block text-2xl font-bold tracking-tight text-[#111111] hover:text-[#707072]"
              >
                Arena Home
              </Link>

              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between py-2 text-2xl font-bold tracking-tight text-[#111111] hover:text-[#707072]"
              >
                <span>Book a Court</span>
                <span className="text-xs font-semibold px-3 py-1 bg-[#111111] text-white rounded-full">
                  ₱300/HR
                </span>
              </Link>

              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="block text-2xl font-bold tracking-tight text-[#111111] hover:text-[#707072]"
              >
                Rates &amp; Gear
              </Link>

              {isLoggedIn ? (
                <>
                  <div className="pt-4 border-t border-[#cacacb]">
                    <div className="text-xs uppercase tracking-widest text-[#707072] font-semibold mb-3">
                      My Account
                    </div>
                    {userRole === 'admin' || userRole === 'owner' ? (
                      <Link
                        href="/admin"
                        onClick={() => setIsOpen(false)}
                        className="block text-lg font-semibold text-[#111111] mb-2"
                      >
                        Admin Center
                      </Link>
                    ) : userRole === 'cashier' ? (
                      <Link
                        href="/cashier"
                        onClick={() => setIsOpen(false)}
                        className="block text-lg font-semibold text-[#111111] mb-2"
                      >
                        Cashier POS
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="block text-lg font-semibold text-[#111111] mb-2"
                      >
                        Player Pass &amp; Bookings
                      </Link>
                    )}
                    <form action={logout}>
                      <button
                        type="submit"
                        className="text-sm font-semibold text-[#d30005] hover:underline pt-2 inline-flex items-center gap-1.5"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="pt-6 border-t border-[#cacacb] space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full"
                  >
                    <Button variant="secondary" size="lg" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block w-full"
                  >
                    <Button variant="default" size="lg" className="w-full">
                      Join C&amp;J Club
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>

          <div className="pt-6 border-t border-[#cacacb] text-xs text-[#707072]">
            <p className="font-semibold text-[#111111]">C&amp;J Pickleball Arena QC</p>
            <p>Tomas Morato, Quezon City • Daily 6 AM – 10 PM</p>
          </div>
        </div>
      )}
    </div>
  );
}
