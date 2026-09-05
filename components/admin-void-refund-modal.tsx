"use client";

import { useState, useTransition } from "react";
import { 
  AlertCircle, 
  Ban, 
  Check, 
  CheckCircle2, 
  Copy, 
  DollarSign, 
  Loader2, 
  Smartphone, 
  Wallet, 
  X,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminVoidAndRefundBooking } from "@/app/actions";

export interface AdminBookingRefundDetails {
  id: string;
  court_name: string;
  start_time: string;
  duration_hours: number;
  total_price: number;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  payment_method: string;
  status: string;
  refund_wallet_type?: string | null;
  refund_account_name?: string | null;
  refund_account_number?: string | null;
  refund_reason?: string | null;
  refund_status?: string | null;
  refund_reference?: string | null;
}

interface AdminVoidRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: AdminBookingRefundDetails;
  onSuccess?: (message: string) => void;
}

export function AdminVoidRefundModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: AdminVoidRefundModalProps) {
  const [refundRef, setRefundRef] = useState(booking.refund_reference || "");
  const [adminNotes, setAdminNotes] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAction = (action: 'void_and_refund' | 'void_only' | 'reject_refund') => {
    setErrorMsg(null);

    startTransition(async () => {
      const res = await adminVoidAndRefundBooking({
        bookingId: booking.id,
        action,
        refundReference: refundRef,
        adminNotes,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onSuccess?.(res.message || "Action completed successfully.");
        onClose();
      }
    });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const hasWalletInfo = Boolean(booking.refund_account_number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog Container */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/80 z-10 text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
          disabled={isPending}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pb-4 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black">
            <Ban className="w-3.5 h-3.5" />
            <span>Admin Schedule Management</span>
          </div>
          <h3 className="text-xl font-black text-white">
            Void Schedule &amp; Process Refund
          </h3>
          <p className="text-xs text-slate-400">
            Booking <span className="font-mono font-bold text-amber-400">#{booking.id.slice(0, 8).toUpperCase()}</span> • {booking.court_name}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">
              {booking.guest_name || "Guest Player"}
            </div>
            <div className="text-[11px] text-slate-400">
              {booking.guest_email || booking.guest_phone || "No contact info"}
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{formatDateTime(booking.start_time)} ({booking.duration_hours} hr)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Paid</span>
            <span className="text-xl font-black text-[#d4ff00]">
              ₱{Number(booking.total_price).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              via {booking.payment_method}
            </span>
          </div>
        </div>

        {/* E-Wallet Payout Details (Provided by user) */}
        {hasWalletInfo ? (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#d4ff00]" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Player&apos;s Requested E-Wallet Payout
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4ff00]/20 text-[#d4ff00] text-xs font-black border border-[#d4ff00]/30">
                {booking.refund_wallet_type || "GCash"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Account Name</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-white truncate">
                    {booking.refund_account_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(booking.refund_account_name || "", "name")}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy name"
                  >
                    {copiedField === "name" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Account / Mobile No.</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-black text-[#d4ff00] truncate">
                    {booking.refund_account_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(booking.refund_account_number || "", "number")}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy number"
                  >
                    {copiedField === "number" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {booking.refund_reason && (
              <div className="text-xs text-slate-300 pt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Player Reason:</span>
                <p className="italic bg-slate-950/50 p-2 rounded-lg border border-slate-800 mt-1">
                  &ldquo;{booking.refund_reason}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            No player-submitted e-wallet details recorded for this reservation. You can still void the schedule to free the court.
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Admin Inputs */}
        <div className="space-y-3.5 mb-6">
          <div className="space-y-1.5">
            <Label htmlFor="refundRef" className="text-xs font-bold text-slate-300">
              E-Wallet Refund Reference / Receipt No.
            </Label>
            <Input
              id="refundRef"
              placeholder="e.g. GCash Ref # 10049284912"
              value={refundRef}
              onChange={(e) => setRefundRef(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-10 rounded-xl placeholder:text-slate-600 focus-visible:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminNotes" className="text-xs font-bold text-slate-300">
              Admin Notes (Optional)
            </Label>
            <Input
              id="adminNotes"
              placeholder="e.g. Refund sent via GCash at 2:30 PM by Admin"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-10 rounded-xl placeholder:text-slate-600 focus-visible:ring-amber-500"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => handleAction('void_and_refund')}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black rounded-xl shadow-lg shadow-emerald-600/25 text-xs flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Void Schedule &amp; Confirm Refund Sent (₱{Number(booking.total_price).toFixed(2)})</span>
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleAction('void_only')}
              className="h-9 border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
            >
              Void Slot (No Refund)
            </Button>

            {booking.status === 'cancelled_refund_pending' && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleAction('reject_refund')}
                className="h-9 border-red-500/30 text-red-400 hover:bg-red-950/30 font-bold text-xs rounded-xl"
              >
                Reject Refund
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
