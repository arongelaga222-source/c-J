import Link from "next/link";
import { AlertCircle, Lock, Mail, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { login } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const { message, next } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden font-sans bg-[#0f1218]">
      {/* Stadium Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-red-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#d4ff00]/10 blur-[110px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md border-white/10 bg-[#171b24]/90 backdrop-blur-2xl shadow-2xl relative z-10 rounded-3xl">
        <form action={login}>
          {next && <input type="hidden" name="next" value={next} />}
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center pb-2">
              <BrandLogo size="md" />
            </div>
            <CardTitle className="text-2xl font-black text-white">Player &amp; Staff Login</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Sign in to manage your court reservations, player pass, and schedules.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Message Alert */}
            {message && (
              <div className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#d4ff00]" /> Email Address
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="player@example.com" 
                required 
                className="bg-slate-950 border-white/10 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#d4ff00]" /> Password
                </Label>
                <Link href="#" className="text-xs text-[#d4ff00] hover:underline font-semibold">
                  Forgot?
                </Link>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="bg-slate-950 border-white/10 text-slate-100 rounded-xl focus-visible:ring-red-500"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-7 pb-6 border-t-0 bg-transparent">
            <AuthSubmitButton 
              label="Sign In to C&J Arena"
              loadingLabel="Signing in..."
              className="w-full h-12 font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/30 rounded-xl transition-all"
            />
            
            <div className="text-xs text-center text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-black text-[#d4ff00] hover:underline">
                Create free player account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}