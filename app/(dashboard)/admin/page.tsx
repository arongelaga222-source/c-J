import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  ShoppingBag, 
  ShieldAlert, 
  Ban, 
  UserPlus, 
  TrendingUp
} from "lucide-react";
import { createCashierAccount, voidTransaction } from "@/app/actions";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // 1. Authenticate & Verify Admin Role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // 2. Fetch All Venue POS Transactions
  const { data: transactions } = await supabase
    .from('pos_transactions')
    .select(`
      id,
      total_amount,
      payment_method,
      status,
      created_at,
      profiles ( full_name )
    `)
    .order('created_at', { ascending: false });

  // 3. Compute Metrics
  const activeTransactions = transactions?.filter(tx => tx.status !== 'voided') || [];
  const totalRevenue = activeTransactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);
  const totalSalesCount = activeTransactions.length;
  const voidedCount = transactions?.filter(tx => tx.status === 'voided').length || 0;

  const formatDateTime = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateStr));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100 font-sans">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              Executive
            </span>
            <h1 className="text-3xl font-black text-white">C&amp;J&apos;s Control Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Audit arena revenue, cashier shift logs, and staff provisioning.</p>
        </div>

        {/* Add Cashier Modal Dialog */}
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-xs font-black transition-all bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/25 h-10 px-4 py-2">
            <UserPlus className="h-4 w-4 mr-2" /> Add Staff Account
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
            <form action={createCashierAccount}>
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white">Provision Cashier Staff</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Create a new staff user account with POS terminal access at C&amp;J&apos;s Courts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-bold text-slate-300">Staff Full Name</Label>
                  <Input id="fullName" name="fullName" placeholder="Jane Doe" required className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-300">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="staff@cjscourts.com" required className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-300">Temporary Password</Label>
                  <Input id="password" name="password" type="password" required className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-black rounded-xl">
                  Create Staff Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Revenue Card */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-20 h-20 text-red-500" />
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Total Venue Revenue</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-white">₱{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-amber-400 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> From {totalSalesCount} completed POS transactions
            </p>
          </CardContent>
        </Card>

        {/* Completed Sales */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Completed Sales</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-white">{totalSalesCount}</div>
            <p className="text-xs text-slate-400">Walk-in fees, pro gear &amp; beverages</p>
          </CardContent>
        </Card>

        {/* Voided Transactions */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Voided / Cancelled</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-red-400">{voidedCount}</div>
            <p className="text-xs text-slate-400">Audited and cancelled orders</p>
          </CardContent>
        </Card>

      </div>

      {/* Master Transaction Audit Table */}
      <Card className="border-slate-800 bg-slate-900/70 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/50 p-6">
          <CardTitle className="text-lg font-black text-white">Master POS Audit Log</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Real-time chronological log of all sales across C&amp;J&apos;s cashier terminals.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/70 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="text-xs font-black text-slate-400">Reference ID</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Cashier</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Timestamp</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Method</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Status</TableHead>
                <TableHead className="text-right text-xs font-black text-slate-400">Amount / Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-xs font-medium">
                    No transactions recorded in the system yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const isVoided = tx.status === 'voided';
                  
                  return (
                    <TableRow key={tx.id} className={`border-slate-800/80 hover:bg-slate-800/40 ${isVoided ? "bg-red-950/20 opacity-70" : ""}`}>
                      <TableCell className="font-mono text-xs text-slate-400">
                        #{tx.id.split('-')[0]}
                      </TableCell>
                      <TableCell className="font-bold text-white text-xs">
                        {(tx.profiles as unknown as { full_name: string } | null)?.full_name || "Cashier Staff"}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {formatDateTime(tx.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 bg-slate-950 text-slate-300 text-[11px] font-bold">
                          {tx.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isVoided ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                            Voided
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Completed
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-3">
                        <span className={`font-black text-sm ${isVoided ? "line-through text-slate-500" : "text-amber-400"}`}>
                          ₱{Number(tx.total_amount).toFixed(2)}
                        </span>
                        
                        {!isVoided && (
                          <form action={async () => {
                            "use server";
                            await voidTransaction(tx.id);
                          }}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              type="submit" 
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/40 border-red-500/30 h-7 text-xs rounded-xl font-bold"
                            >
                              <Ban className="h-3 w-3 mr-1" /> Void
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}