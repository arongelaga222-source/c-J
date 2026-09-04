"use client";

import { useState, useTransition } from "react";
import { 
  AlertCircle, 
  Banknote, 
  CheckCircle2, 
  CreditCard, 
  HelpCircle, 
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
import { requestBookingRefund } from "@/app/actions";

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    court_name: string;
    start_time: string;
    duration_hours: number;
    total_price: number;
  };
  onSuccess: (message: string) => void;
}

export function RefundRequestModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: RefundRequestModalProps) {
  const [walletType, setWalletType] = useState("GCash");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [reason, setReason] = useState("Schedule Conflict");
  const [customReason, setCustomReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!accountName.trim() || !accountNumber.trim()) {
      setErrorMsg("Please fill in both the account holder name and account/mobile number.");
      return;
    }

    const finalReason = reason === "Other" ? (customReason.trim() || "Other reason") : reason;

    startTransition(async () => {
      const res = await requestBookingRefund({
        bookingId: booking.id,
        walletType,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        reason: finalReason,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onSuccess(res.message || "Cancellation and refund requested successfully.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#171b24] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 z-10 text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
          disabled={isPending}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pb-4 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
            <Wallet className="w-3.5 h-3.5 text-[#d4ff00]" />
            <span>Cancellation &amp; E-Wallet Refund</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Request Court Refund
          </h3>
          <p className="text-xs text-slate-400">
            Please provide your GCash or E-Wallet account so management can disburse your refundable amount.
          </p>
        </div>

        {/* Booking Summary Strip */}
        <div className="my-4 p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {booking.court_name}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatDateTime(booking.start_time)} ({booking.duration_hours} hr)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Refund Amount</span>
            <span className="text-lg font-black text-[#d4ff00]">
              ₱{Number(booking.total_price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Refund Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* E-Wallet Provider Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-300">
              Select Receiving E-Wallet
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {["GCash", "Maya", "GrabPay", "GoTyme", "Bank / Other"].map((wallet) => (
                <button
                  key={wallet}
                  type="button"
                  onClick={() => setWalletType(wallet)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    walletType === wallet
                      ? "bg-gradient-to-r from-red-600/30 to-amber-500/30 border-[#d4ff00] text-white shadow-sm"
                      : "bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {wallet}
                </button>
              ))}
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <Label htmlFor="accountName" className="text-xs font-bold text-slate-300">
              Account Holder Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="accountName"
              placeholder="e.g. Juan C. Dela Cruz"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              className="bg-slate-950 border-white/10 text-slate-100 text-xs h-10 rounded-xl placeholder:text-slate-500 focus-visible:ring-red-500"
            />
          </div>

          {/* Account / Mobile Number */}
          <div className="space-y-1.5">
            <Label htmlFor="accountNumber" className="text-xs font-bold text-slate-300">
              {walletType} Account / Mobile Number <span className="text-red-400">*</span>
            </Label>
            <Input
              id="accountNumber"
              placeholder="e.g. 0917 123 4567"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              className="bg-slate-950 border-white/10 text-slate-100 text-xs h-10 rounded-xl placeholder:text-slate-500 focus-visible:ring-red-500"
            />
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-bold text-slate-300">
              Reason for Cancellation
            </Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 text-slate-200 text-xs h-10 px-3 rounded-xl focus:ring-1 focus:ring-red-500 outline-none"
            >
              <option value="Schedule Conflict">Schedule Conflict</option>
              <option value="Emergency / Illness">Emergency / Illness</option>
              <option value="Severe Weather / Travel Issues">Severe Weather / Travel Issues</option>
              <option value="Booked Wrong Court or Time">Booked Wrong Court or Time</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          {reason === "Other" && (
            <div className="space-y-1.5">
              <Input
                placeholder="Briefly state your reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="bg-slate-950 border-white/10 text-slate-100 text-xs h-10 rounded-xl placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Policy Note */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
            <strong>24-Hour Policy Notice:</strong> Refunds are reviewed by management. Once approved, the funds will be transferred to your specified {walletType} account.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="w-1/3 h-11 border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-bold text-xs"
            >
              Keep Slot
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-2/3 h-11 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black rounded-xl shadow-lg shadow-red-600/30 text-xs flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Submit Refund Request (₱{Number(booking.total_price).toFixed(2)})</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
