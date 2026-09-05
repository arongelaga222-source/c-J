import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/actions";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  ShoppingCart, 
  Calendar, 
  LogOut, 
  ShieldAlert, 
  Home
} from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // 1. Fetch current authenticated user & their role
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "client";
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-200">
      {/* Sleek Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col justify-between shrink-0 transition-colors duration-200">
        <div>
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-slate-800 space-y-3">
            <Link href="/" className="flex items-center justify-center group py-1">
              <BrandLogo size="sm" className="group-hover:scale-105 transition-transform" />
            </Link>

            {/* Staff Card */}
            <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-400 text-white flex items-center justify-center font-black text-xs">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{profile?.full_name || user.email}</p>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-400">
                  {userRole} Terminal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="text-[11px] font-black text-amber-400/80 uppercase tracking-widest px-3 mb-2 mt-1">
              Operations
            </div>

            <Link 
              href="/cashier" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-sm font-bold text-slate-300 hover:text-white transition-all group"
            >
              <ShoppingCart className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
              POS Register
            </Link>

            <Link 
              href="/cashier/schedule" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-sm font-bold text-slate-300 hover:text-white transition-all group"
            >
              <Calendar className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
              Daily Court Schedule
            </Link>

            {isOwnerOrAdmin && (
              <>
                <div className="text-[11px] font-black text-red-400/80 uppercase tracking-widest px-3 mb-2 mt-6">
                  Executive Admin
                </div>

                <Link 
                  href="/admin" 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-sm font-bold transition-all group"
                >
                  <ShieldAlert className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
                  Admin Center
                </Link>
              </>
            )}

            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 mt-6">
              Quick Shortcuts
            </div>

            <Link 
              href="/book" 
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Public Booking Page
            </Link>

            <Link 
              href="/" 
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
            >
              <Home className="h-3.5 w-3.5 text-slate-500" />
              Public Homepage
            </Link>
          </nav>
        </div>

        {/* Theme Toggle & Working Logout Action */}
        <div className="p-4 border-t border-border space-y-2">
          <ThemeToggle showLabel className="w-full justify-center" />
          <form action={logout}>
            <Button 
              variant="ghost" 
              type="submit" 
              className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl font-bold text-xs cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Terminal Content */}
      <main className="flex-1 overflow-auto bg-background transition-colors duration-200">
        {children}
      </main>
    </div>
  );
}