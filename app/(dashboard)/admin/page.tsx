import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Users, ShoppingBag, ShieldAlert, Ban, UserPlus } from "lucide-react";
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

  // 2. Fetch All Venue POS Transactions (joined with cashier profiles)
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

  // 3. Compute Metrics (excluding voided transactions from revenue)
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500">Monitor venue revenue, audit cashier terminals, and manage staff.</p>
        </div>

        {/* Add Cashier Modal Dialog */}
 {/* Add Cashier Modal Dialog */}
<Dialog>
  <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white shadow hover:bg-emerald-700 h-9 px-4 py-2">
    <UserPlus className="h-4 w-4 mr-2" /> Add Cashier Account
  </DialogTrigger>
  <DialogContent className="sm:max-w-md">
    <form action={createCashierAccount}>
      <DialogHeader>
        <DialogTitle>Create New Cashier</DialogTitle>
        <DialogDescription>
          Provision a new account with restricted cashier terminal access.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" placeholder="cashier@smashcourt.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Temporary Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
          Create Cashier
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Venue Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">₱{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">From {totalSalesCount} completed POS transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completed Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalSalesCount}</div>
            <p className="text-xs text-slate-500 mt-1">Walk-ins & retail items sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Voided Transactions</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{voidedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Audited and cancelled orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Master Transaction Audit Table with Void Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Master Transaction Log</CardTitle>
          <CardDescription>All venue sales across all cashiers. Admins can audit or void transactions here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference ID</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount / Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    No transactions recorded in the system yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const isVoided = tx.status === 'voided';
                  
                  return (
                    <TableRow key={tx.id} className={isVoided ? "bg-red-50/50 opacity-75" : ""}>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {tx.id.split('-')[0]}...
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {(tx.profiles as any)?.full_name || "Unknown Cashier"}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {formatDateTime(tx.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          {tx.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isVoided ? (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 border-none">
                            Voided
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none">
                            Completed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-3">
                        <span className={`font-bold ${isVoided ? "line-through text-slate-400" : "text-slate-900"}`}>
                          ₱{Number(tx.total_amount).toFixed(2)}
                        </span>
                        
                        {!isVoided && (
                          <form action={async () => {
                            "use server";
                            await voidTransaction(tx.id);
                          }}>
                            <Button variant="outline" size="sm" type="submit" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8">
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