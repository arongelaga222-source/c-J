import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, QrCode, Receipt, TrendingUp } from "lucide-react";

export default async function CashierReportsPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch all POS transactions processed by this cashier
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
  
  const cashSales = transactions?.filter(tx => tx.payment_method?.toLowerCase() === 'cash').reduce((sum, tx) => sum + Number(tx.total_amount), 0) || 0;
  const digitalSales = totalSales - cashSales;

  const formatDateTime = (dateStr: string) => 
    new Intl.DateTimeFormat('en-PH', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateStr));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-slate-100 font-sans">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-400" />
          <h1 className="text-3xl font-black text-white">C&amp;J&apos;s Shift &amp; Sales Reports</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Summary of all transactions processed under your cashier terminal account.</p>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Shift Sales */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Total Shift Sales</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-white">₱{totalSales.toFixed(2)}</div>
            <p className="text-xs text-amber-400 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> {totalTransactions} transactions processed
            </p>
          </CardContent>
        </Card>

        {/* Cash Drawer */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Cash Drawer</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Banknote className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-white">₱{cashSales.toFixed(2)}</div>
            <p className="text-xs text-slate-400">Physical currency on hand</p>
          </CardContent>
        </Card>

        {/* Digital Payments */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md relative overflow-hidden rounded-3xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">Digital / QR Ph</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <QrCode className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-white">₱{digitalSales.toFixed(2)}</div>
            <p className="text-xs text-slate-400">GCash, Maya &amp; Card payments</p>
          </CardContent>
        </Card>

      </div>

      {/* Detailed Transaction History Table */}
      <Card className="border-slate-800 bg-slate-900/70 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/50 p-6">
          <CardTitle className="text-lg font-black text-white">Your Shift Transaction History</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            A chronological record of every sale processed during your active session.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/70 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="text-xs font-black text-slate-400">Reference ID</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Timestamp</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Payment Method</TableHead>
                <TableHead className="text-right text-xs font-black text-slate-400">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500 text-xs font-medium">
                    No transactions recorded for this cashier shift yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-slate-800/80 hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs text-slate-400">
                      #{tx.id.split('-')[0]}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs">
                      {formatDateTime(tx.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1.5 border-slate-700 bg-slate-950 text-slate-300 text-[11px] font-bold">
                        {tx.payment_method === 'Cash' && <Banknote className="h-3 w-3 text-amber-400" />}
                        {tx.payment_method === 'Card' && <CreditCard className="h-3 w-3 text-sky-400" />}
                        {tx.payment_method !== 'Cash' && tx.payment_method !== 'Card' && <QrCode className="h-3 w-3 text-red-400" />}
                        {tx.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-sm text-amber-400">
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