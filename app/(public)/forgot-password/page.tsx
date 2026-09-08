import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { resetPasswordWithTempPassword } from "@/app/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; success?: string }>;
}) {
  const { message, success } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 font-sans bg-white text-[#111111]">
      <div className="w-full max-w-md border border-[#cacacb] p-8 sm:p-10 bg-white space-y-6">
        {success ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center pb-2">
              <CheckCircle2 className="h-12 w-12 text-[#007d48]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] uppercase">
              Check Your Email
            </h1>
            <p className="text-sm text-[#707072]">
              {success}
            </p>
            <div className="pt-4">
              <Link href="/login">
                <button className="w-full h-12 bg-[#111111] text-white hover:bg-[#222222] font-medium text-sm rounded-full">
                  Return to Login
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <form action={resetPasswordWithTempPassword} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center pb-2">
                <BrandLogo size="md" withSubtitle />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] uppercase">
                Reset Password
              </h1>
              <p className="text-xs text-[#707072]">
                Enter your email address and we&apos;ll send you a temporary password to access your account.
              </p>
            </div>

            {message && (
              <div className="p-3 border border-[#d30005] bg-white text-[#d30005] text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="player@example.com" 
                  required 
                  className="h-11 px-4 rounded-full bg-[#f5f5f5] text-sm text-[#111111] placeholder:text-[#707072]"
                />
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <AuthSubmitButton 
                label="Send Temporary Password"
                loadingLabel="Sending..."
                className="w-full h-12 bg-[#111111] text-white hover:bg-[#222222] font-medium text-sm rounded-full"
              />
              
              <div className="text-xs text-center text-[#707072]">
                <Link href="/login" className="font-semibold text-[#111111] hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
