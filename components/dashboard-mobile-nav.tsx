'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  ShoppingCart,
  Calendar,
  ShieldAlert,
  Home,
  LogOut
} from 'lucide-react';
import { logout } from '@/app/actions';

interface DashboardMobileNavProps {
  userRole: string;
  userName: string;
  isOwnerOrAdmin: boolean;
}

export function DashboardMobileNav({
  userRole,
  userName,
  isOwnerOrAdmin,
}: DashboardMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden sticky top-0 z-50 bg-[#16181e] border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-md">
      <Link href="/" className="flex items-center">
        <BrandLogo size="sm" />
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
          {userRole}
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-white/10"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-[#14161b]/95 backdrop-blur-xl border-t border-white/10 flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-top duration-200">
          <div className="space-y-5">
            {/* User Profile Info */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-400 text-white flex items-center justify-center font-black text-xs shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <span className="text-[10px] font-black uppercase text-amber-400">
                  {userRole} Terminal
                </span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="space-y-2">
              <div className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest px-2">
                Operations
              </div>

              <Link
                href="/cashier"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-900 border border-white/5 text-sm font-bold text-slate-200 hover:text-white"
              >
                <ShoppingCart className="h-4 w-4 text-red-400" />
                POS Register
              </Link>

              <Link
                href="/cashier/schedule"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-900 border border-white/5 text-sm font-bold text-slate-200 hover:text-white"
              >
                <Calendar className="h-4 w-4 text-amber-400" />
                Daily Court Schedule
              </Link>

              {isOwnerOrAdmin && (
                <>
                  <div className="text-[10px] font-black text-red-400/80 uppercase tracking-widest px-2 pt-3">
                    Executive Admin
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 font-bold text-sm"
                  >
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                    Admin Center
                  </Link>
                </>
              )}

              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 pt-3">
                Quick Shortcuts
              </div>

              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                <Calendar className="h-4 w-4 text-slate-500" />
                Public Booking Page
              </Link>

              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                <Home className="h-4 w-4 text-slate-500" />
                Public Homepage
              </Link>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-6">
            <form action={logout}>
              <Button
                variant="ghost"
                type="submit"
                className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl font-bold text-xs"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
