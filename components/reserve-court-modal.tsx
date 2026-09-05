"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  UserCheck, 
  UserPlus, 
  ArrowRight, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReserveCourtModalProps {
  isLoggedIn?: boolean;
  triggerClassName?: string;
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerVariant?: "default" | "outline" | "ghost";
  buttonText?: string;
  showIcon?: boolean;
}

export function ReserveCourtModal({
  isLoggedIn = false,
  triggerClassName,
  triggerSize = "lg",
  triggerVariant = "default",
  buttonText = "Reserve Court (₱300 / hr)",
  showIcon = true,
}: ReserveCourtModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push("/book");
    } else {
      setIsOpen(true);
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <Button
        size={triggerSize}
        variant={triggerVariant}
        onClick={handleTriggerClick}
        className={triggerClassName}
      >
        <span>{buttonText}</span>
        {showIcon && <ArrowRight className="w-4 h-4 ml-1.5" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#171b24] border border-white/15 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/60 z-10 text-slate-100 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Brand Icon */}
            <div className="text-center space-y-3 pb-2">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-red-600/20 to-amber-500/20 border border-red-500/30 text-red-400 mb-1">
                <Trophy className="w-7 h-7 text-[#d4ff00]" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Already Have an Account?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                Sign in to your player account for faster checkout and booking history, or register for free in seconds!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Link 
                href="/login?next=/book"
                onClick={() => setIsOpen(false)}
                className="w-full block"
              >
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black rounded-xl shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 text-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>I have an account</span>
                </Button>
              </Link>

              <Link 
                href="/signup?next=/book"
                onClick={() => setIsOpen(false)}
                className="w-full block"
              >
                <Button 
                  variant="outline"
                  className="w-full h-12 border-[#d4ff00]/40 text-[#d4ff00] hover:bg-[#d4ff00]/10 hover:border-[#d4ff00] font-black rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>I don&apos;t have an account</span>
                </Button>
              </Link>
            </div>

            {/* Optional Guest bypass */}
            <div className="pt-5 text-center border-t border-white/10 mt-6">
              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-400 hover:text-white underline font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Continue booking as guest</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
