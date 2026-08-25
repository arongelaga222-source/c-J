import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, Smartphone, Receipt } from "lucide-react";

export default async function CashierReportsPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch all POS transactions processed by THIS specific cashier
  const { data: transactions } = await supabase
    .from("pos_transactions")
    .select(`
      id,
      total_amount,
      payment_method,
      created_at
    `)
    .eq("cashier_id", user.id)
    .order("created_at", { ascending: false });

  // 3. Compute shift metrics
  const totalSales = transactions?.reduce((sum, tx) => sum + Number(tx.total_amount), 0) || 0;
  const totalTransactions = transactions?.length || 0;
  
  const cashSales = transactions?.filter(tx => tx.payment_method === 'Cash').reduce((sum, tx) => sum + Number(tx.total_amount), 0) || 0;
  const digitalSales = totalSales - cashSales;

  const formatDateTime = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateStr));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Shift & Sales Reports</h1>
        <p className="text-slate-500">Summary of all transactions processed under your cashier account.</p>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Shift Sales</CardTitle>
            <Receipt className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">₱{totalSales.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">{totalTransactions} total transactions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Cash Drawer</CardTitle>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">₱{cashSales.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Physical cash collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Card / E-Wallet</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">₱{digitalSales.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Digital payments processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Transaction History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete log of every sale you made today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                    No transactions recorded for this account yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {tx.id}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatDateTime(tx.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1.5 border-slate-200 bg-slate-50 text-slate-700">
                        {tx.payment_method === 'Cash' && <Banknote className="h-3 w-3 text-emerald-600" />}
                        {tx.payment_method === 'Card' && <CreditCard className="h-3 w-3 text-blue-600" />}
                        {tx.payment_method === 'E-Wallet' && <Smartphone className="h-3 w-3 text-purple-600" />}
                        {tx.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      ₱{Number(tx.total_amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}