'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Percent,
  Download,
  Search,
  UserPlus,
  Ban,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Banknote,
  Wallet,
} from 'lucide-react';
import { createCashierAccount, voidTransaction } from '@/app/actions';
import { AdminVoidRefundModal } from '@/components/admin-void-refund-modal';

export interface AdminBookingRecord {
  id: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_price: number;
  status: string;
  payment_method: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  court_name: string;
  created_at: string;
  refund_wallet_type?: string | null;
  refund_account_name?: string | null;
  refund_account_number?: string | null;
  refund_reason?: string | null;
  refund_status?: string | null;
  refund_reference?: string | null;
  refund_processed_at?: string | null;
}

export interface AdminMetrics {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  monthOverMonthGrowth: number;
  ytdRevenue: number;
  totalHoursBooked: number;
  monthlyHoursBooked: number;
  courtOccupancyRate: number; // in percentage, e.g. 68.5%
  paymongoRevenue: number;
  cashRevenue: number;
  totalTransactionsCount: number;
}

export default function AdminDashboardClient({
  metrics,
  bookings,
}: {
  metrics: AdminMetrics;
  bookings: AdminBookingRecord[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [voidModalBooking, setVoidModalBooking] = useState<AdminBookingRecord | null>(null);

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      b.id.toLowerCase().includes(query) ||
      (b.guest_name && b.guest_name.toLowerCase().includes(query)) ||
      (b.guest_email && b.guest_email.toLowerCase().includes(query)) ||
      b.court_name.toLowerCase().includes(query) ||
      (b.refund_reference && b.refund_reference.toLowerCase().includes(query)) ||
      (b.refund_account_name && b.refund_account_name.toLowerCase().includes(query)) ||
      (b.refund_account_number && b.refund_account_number.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || b.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Count pending refunds for top banner alert
  const pendingRefunds = bookings.filter(
    (b) => b.status === 'cancelled_refund_pending' || b.refund_status === 'pending'
  );

  // Export Bookings Audit to CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;

    const headers = [
      'Booking ID',
      'Player Name',
      'Email',
      'Phone',
      'Court',
      'Start Time',
      'End Time',
      'Duration (Hours)',
      'Total Amount (PHP)',
      'Payment Method',
      'Status',
      'Refund Status',
      'Refund Wallet',
      'Refund Account Name',
      'Refund Account Number',
      'Refund Reference',
      'Created At',
    ];

    const rows = filteredBookings.map((b) => [
      b.id,
      `"${b.guest_name || 'Walk-in'}"`,
      `"${b.guest_email || ''}"`,
      `"${b.guest_phone || ''}"`,
      `"${b.court_name}"`,
      `"${b.start_time}"`,
      `"${b.end_time}"`,
      b.duration_hours,
      b.total_price,
      b.payment_method,
      b.status,
      b.refund_status || 'none',
      `"${b.refund_wallet_type || ''}"`,
      `"${b.refund_account_name || ''}"`,
      `"${b.refund_account_number || ''}"`,
      `"${b.refund_reference || ''}"`,
      `"${b.created_at}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CJ_Court_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateStr: string) =>
    new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));

  // PayMongo vs Cash percentage calculation
  const totalRev = metrics.paymongoRevenue + metrics.cashRevenue || 1;
  const paymongoPercent = Math.round((metrics.paymongoRevenue / totalRev) * 100);
  const cashPercent = 100 - paymongoPercent;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100 font-sans">
      {/* Header & Staff Account Provisioning */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              Executive Owner
            </span>
            <h1 className="text-3xl font-black text-white">C&amp;J Court Financial &amp; Operations Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time revenue metrics, occupancy utilization, PayMongo channel analytics, and master booking audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="border-slate-800 text-slate-200 hover:text-white rounded-xl h-10 px-4 text-xs font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-amber-400" /> Export CSV Audit
          </Button>

          {/* Add Staff Account Modal */}
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-xs font-black transition-all bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/25 h-10 px-4 py-2">
              <UserPlus className="h-4 w-4 mr-2" /> Add Staff Account
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
              <form action={createCashierAccount}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-black text-white">Provision Staff Account</DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Create a new user account with Cashier or Manager permissions at C&amp;J Court.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-bold text-slate-300">
                      Staff Full Name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Jane Doe"
                      required
                      className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="staff@cjcourt.com"
                      required
                      className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-xs font-bold text-slate-300">
                      Role
                    </Label>
                    <select
                      id="role"
                      name="role"
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold"
                    >
                      <option value="cashier">Cashier Staff</option>
                      <option value="owner">Owner / Co-Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-300">
                      Temporary Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-black rounded-xl"
                  >
                    Create Account
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Refund Requests Notification Banner */}
      {pendingRefunds.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-red-500/15 to-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                Pending Refund Requests ({pendingRefunds.length})
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Players have submitted cancellation requests with GCash / E-Wallet payout details. Void schedule to release the court slot and issue their refund payout.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setStatusFilter('cancelled_refund_pending');
              const el = document.getElementById('audit-table');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 h-9 rounded-xl shadow-lg shadow-amber-500/20 shrink-0"
          >
            Filter Pending Requests
          </Button>
        </div>
      )}

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Monthly Gross Revenue Card */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl relative overflow-hidden shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
                Monthly Gross Revenue
              </CardTitle>
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-white">₱{metrics.thisMonthRevenue.toFixed(2)}</div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              {metrics.monthOverMonthGrowth >= 0 ? '+' : ''}
              {metrics.monthOverMonthGrowth.toFixed(1)}% vs. Last Month
            </p>
          </CardContent>
        </Card>

        {/* Year-to-Date (YTD) Gross Revenue */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl relative overflow-hidden shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
                Year-To-Date (YTD) Gross
              </CardTitle>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-amber-400">₱{metrics.ytdRevenue.toFixed(2)}</div>
            <p className="text-xs text-slate-400">Total verified bookings &amp; sales</p>
          </CardContent>
        </Card>

        {/* Total Hours Booked */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl relative overflow-hidden shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
                Total Hours Booked
              </CardTitle>
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-white">{metrics.totalHoursBooked} hrs</div>
            <p className="text-xs text-slate-400">
              {metrics.monthlyHoursBooked} hrs booked this month
            </p>
          </CardContent>
        </Card>

        {/* Court Utilization / Occupancy Rate */}
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl relative overflow-hidden shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
                Court Utilization Rate
              </CardTitle>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Percent className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-black text-emerald-400">
              {metrics.courtOccupancyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-400">Based on 16 operating hrs/day × 2 courts</p>
          </CardContent>
        </Card>

      </div>

      {/* Payment Channel Breakdown Card */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Revenue Stream Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              PayMongo Online (GCash, Maya, Cards) vs. Counter Walk-In Cash
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Volume: </span>
            <span className="font-black text-white">₱{(metrics.paymongoRevenue + metrics.cashRevenue).toFixed(2)}</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${paymongoPercent}%` }}
              className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-500"
              title={`PayMongo: ${paymongoPercent}%`}
            />
            <div
              style={{ width: `${cashPercent}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Cash: ${cashPercent}%`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-300">PayMongo (GCash/Cards):</span>
                <span className="font-black text-white">
                  ₱{metrics.paymongoRevenue.toFixed(2)} ({paymongoPercent}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-300">Cash / Counter POS:</span>
                <span className="font-black text-white">
                  ₱{metrics.cashRevenue.toFixed(2)} ({cashPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Master Booking & Client Audit Log Table */}
      <Card id="audit-table" className="border-slate-800 bg-slate-900/70 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
        <CardHeader className="border-b border-slate-800 bg-slate-950/60 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black text-white">Master Court Booking Audit Log</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Complete record of public reservations, walk-in locks, and status transitions.
              </CardDescription>
            </div>

            {/* Live Filter & Search Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search player, email, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl text-xs h-9"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="checked_in">Checked In</option>
                <option value="walk_in">Walk-in</option>
                <option value="cancelled_refund_pending">Refund Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Payment Method filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300"
              >
                <option value="all">All Channels</option>
                <option value="paymongo">PayMongo</option>
                <option value="cash">Cash POS</option>
                <option value="counter_qr">Counter QR</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/70 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="text-xs font-black text-slate-400">Ref ID</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Player</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Court</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Time Interval</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Channel</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Status</TableHead>
                <TableHead className="text-right text-xs font-black text-slate-400">Amount Paid</TableHead>
                <TableHead className="text-right text-xs font-black text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500 text-xs font-medium">
                    No bookings matched your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((b) => {
                  const isCheckedIn = b.status === 'checked_in';
                  const isPaid = b.status === 'paid';
                  const isRefundPending = b.status === 'cancelled_refund_pending' || b.refund_status === 'pending';
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <TableRow key={b.id} className="border-slate-800/80 hover:bg-slate-800/40">
                      <TableCell className="font-mono text-xs text-amber-400 font-bold">
                        #{b.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-white text-xs">{b.guest_name || 'Player'}</div>
                        <div className="text-[11px] text-slate-400">{b.guest_email || 'Walk-in client'}</div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-200 text-xs">{b.court_name}</TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {formatDateTime(b.start_time)} ({b.duration_hours} hr{b.duration_hours > 1 ? 's' : ''})
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-950 text-slate-300 border border-slate-800">
                          {b.payment_method}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isCheckedIn ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Checked In
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Paid
                          </span>
                        ) : isRefundPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                            Refund Queued
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900 text-slate-300 border border-slate-800">
                            {b.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-black text-sm text-white">
                        ₱{Number(b.total_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isRefundPending ? (
                          <Button
                            size="sm"
                            onClick={() => setVoidModalBooking(b)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] h-7 px-2.5 rounded-lg shadow-lg shadow-amber-500/20 inline-flex items-center gap-1.5"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            Review Refund
                          </Button>
                        ) : isCancelled ? (
                          <div className="text-right">
                            {b.refund_reference ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                                title={`Refund Ref: ${b.refund_reference}`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Refunded
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">Voided</span>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVoidModalBooking(b)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/15 hover:border-red-500/60 font-bold text-[11px] h-7 px-2.5 rounded-lg inline-flex items-center gap-1.5 transition-all"
                          >
                            <Ban className="w-3 h-3" />
                            Void Slot
                          </Button>
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

      {/* Admin Void and Refund Modal */}
      {voidModalBooking && (
        <AdminVoidRefundModal
          isOpen={!!voidModalBooking}
          onClose={() => setVoidModalBooking(null)}
          booking={voidModalBooking}
          onSuccess={() => setVoidModalBooking(null)}
        />
      )}
    </div>
  );
}
