'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Calendar, Tag, UserCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/actions';

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
        className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-white/10"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-[#171b24]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-top duration-200">
          <div className="space-y-6">
            <div className="text-xs font-black uppercase tracking-widest text-[#d4ff00]">
              C&amp;J Navigation
            </div>

            <nav className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-white/5 text-sm font-bold text-slate-200 hover:text-white"
              >
                <Home className="w-4 h-4 text-red-400" />
                Arena Home
              </Link>

              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600/20 to-amber-500/20 border border-red-500/30 text-sm font-bold text-white"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Book Court Slot</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-black bg-[#d4ff00] text-slate-950 rounded-md">
                  ₱300/HR
                </span>
              </Link>

              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-white/5 text-sm font-bold text-slate-200 hover:text-white"
              >
                <Tag className="w-4 h-4 text-[#d4ff00]" />
                Rates &amp; Gear Rentals
              </Link>

              {isLoggedIn && (
                <Link
                  href={userRole === 'admin' || userRole === 'owner' ? '/admin' : userRole === 'cashier' ? '/cashier' : '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm font-bold text-amber-300"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  {userRole === 'admin' || userRole === 'owner' ? 'Admin Center' : userRole === 'cashier' ? 'POS Terminal' : 'My Bookings Dashboard'}
                </Link>
              )}
            </nav>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            {isLoggedIn ? (
              <form action={logout}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-11 border-red-500/40 text-red-400 hover:bg-red-950/40 font-bold rounded-xl text-xs"
                >
                  Sign Out
                </Button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full h-11 border-white/15 text-slate-200 font-bold rounded-xl text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full h-11 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black rounded-xl text-xs">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
