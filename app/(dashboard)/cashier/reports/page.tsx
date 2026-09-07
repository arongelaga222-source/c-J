import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <div className="p-6 sm:p-10 max-w-[1440px] mx-auto space-y-8 text-[#111111] font-sans bg-white">
      {/* Header & Overview */}
      <div className="border-b border-[#cacacb] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#707072]">
            Operations
          </span>
          <span className="text-xs text-[#cacacb]">•</span>
          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#111111] border border-[#cacacb]">
            Terminal Reconciliation
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-[#111111]">
          SHIFT &amp; SALES RECONCILIATION
        </h1>
        <p className="text-xs text-[#707072] mt-1">
          End-of-shift telemetry, physical cash drawer balancing, and digital checkout summaries.
        </p>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Shift Sales */}
        <div className="border border-[#cacacb] bg-white p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#707072]">Gross Shift Revenue</span>
            <div className="w-8 h-8 rounded-full bg-[#f5f5f5] border border-[#cacacb] flex items-center justify-center text-[#111111]">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-4xl font-display uppercase tracking-tight text-[#111111]">
            ₱{totalSales.toFixed(2)}
          </div>
          <p className="text-xs text-[#707072] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-[#007d48]" /> {totalTransactions} sales transactions
          </p>
        </div>

        {/* Cash Drawer */}
        <div className="border border-[#cacacb] bg-white p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#707072]">Cash Drawer (Tender)</span>
            <div className="w-8 h-8 rounded-full bg-[#f5f5f5] border border-[#cacacb] flex items-center justify-center text-[#111111]">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="text-4xl font-display uppercase tracking-tight text-[#111111]">
            ₱{cashSales.toFixed(2)}
          </div>
          <p className="text-xs text-[#707072]">Physical currency in register drawer</p>
        </div>

        {/* Digital Payments */}
        <div className="border border-[#cacacb] bg-white p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-[#707072]">Digital &amp; QR Ph</span>
            <div className="w-8 h-8 rounded-full bg-[#f5f5f5] border border-[#cacacb] flex items-center justify-center text-[#111111]">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="text-4xl font-display uppercase tracking-tight text-[#111111]">
            ₱{digitalSales.toFixed(2)}
          </div>
          <p className="text-xs text-[#707072]">GCash, Maya &amp; terminal cards</p>
        </div>

      </div>

      {/* Detailed Transaction History Table */}
      <Card className="border border-[#cacacb] bg-white rounded-none shadow-none overflow-hidden">
        <CardHeader className="border-b border-[#cacacb] bg-[#f5f5f5] p-6">
          <CardTitle className="text-lg font-bold uppercase tracking-tight text-[#111111]">
            Session Audit Log
          </CardTitle>
          <CardDescription className="text-xs text-[#707072] mt-0.5">
            Chronological audit log of all register transactions recorded during your session.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-[#cacacb]">
              <TableRow className="border-[#cacacb]">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Reference</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Timestamp</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Channel</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-[#707072] text-xs font-medium">
                    No transactions recorded for this cashier shift yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-b border-[#cacacb] hover:bg-[#f5f5f5]/60 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-[#111111] py-4">
                      #{tx.id.split('-')[0].toUpperCase()}
                    </TableCell>
                    <TableCell className="text-[#707072] text-xs py-4 font-mono">
                      {formatDateTime(tx.created_at)}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f5] text-[#111111] border border-[#cacacb] text-[11px] font-bold uppercase tracking-wider">
                        {tx.payment_method === 'Cash' && <Banknote className="h-3 w-3 text-[#111111]" />}
                        {tx.payment_method === 'Card' && <CreditCard className="h-3 w-3 text-[#111111]" />}
                        {tx.payment_method !== 'Cash' && tx.payment_method !== 'Card' && <QrCode className="h-3 w-3 text-[#111111]" />}
                        {tx.payment_method}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm text-[#111111] py-4">
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