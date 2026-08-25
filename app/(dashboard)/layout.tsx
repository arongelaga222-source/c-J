import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/actions";
import { ShoppingCart, Calendar, BarChart3, LogOut, ShieldAlert } from "lucide-react";

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

  const userRole = profile?.role || "customer";
  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white tracking-wide">SmashCourt OS</h2>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {profile?.full_name || user.email}
          </p>
          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
            {userRole} Terminal
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-2">
            Operations
          </div>
          <Link href="/cashier" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-800 text-sm font-medium transition-colors">
            <ShoppingCart className="h-4 w-4 text-slate-400" />
            Point of Sale (POS)
          </Link>
          <Link href="/cashier/schedule" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-800 text-sm font-medium transition-colors">
            <Calendar className="h-4 w-4 text-slate-400" />
            Daily Schedule
          </Link>
          <Link href="/cashier/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-800 text-sm font-medium transition-colors">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            My Shift Reports
          </Link>

          {/* Optional Admin quick-switch if the logged-in user is an admin */}
          {isAdmin && (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-8">
                Admin Area
              </div>
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-800 text-sm font-medium text-amber-400 transition-colors">
                <ShieldAlert className="h-4 w-4" />
                Admin Dashboard
              </Link>
            </>
          )}
        </nav>
        
        {/* Working Logout Form Action */}
        <div className="p-4 border-t border-slate-800">
          <form action={logout}>
            <Button variant="ghost" type="submit" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}