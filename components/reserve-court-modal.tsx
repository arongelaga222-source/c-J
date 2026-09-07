"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
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
  triggerVariant?: "default" | "outline" | "ghost" | "secondary" | "on-image";
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-md bg-white border border-[#cacacb] rounded-none p-6 sm:p-8 z-10 text-[#111111] animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#707072] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 pb-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#707072]">
                Court Reservation
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-[#111111]">
                Book Your Session
              </h3>
              <p className="text-sm text-[#707072] leading-relaxed max-w-xs mx-auto">
                Sign in to your player account for 1-tap checkout and digital pass access, or proceed with new registration.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6">
              <Link 
                href="/login?next=/book"
                onClick={() => setIsOpen(false)}
                className="w-full block"
              >
                <Button 
                  size="lg"
                  className="w-full bg-[#111111] text-white hover:bg-[#222222] font-medium text-sm flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In &amp; Book</span>
                </Button>
              </Link>

              <Link 
                href="/signup?next=/book"
                onClick={() => setIsOpen(false)}
                className="w-full block"
              >
                <Button 
                  size="lg"
                  variant="secondary"
                  className="w-full bg-[#f5f5f5] text-[#111111] hover:bg-[#e5e5e5] font-medium text-sm flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </Button>
              </Link>
            </div>

            {/* Guest bypass */}
            <div className="pt-6 text-center border-t border-[#cacacb] mt-6">
              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="text-sm text-[#111111] underline hover:text-[#707072] font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>Continue booking as guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
