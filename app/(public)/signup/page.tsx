import Link from "next/link";
import { User, Mail, Lock, ArrowRight, CheckCircle2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { signup } from "@/app/actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; verification_sent?: string; email?: string; next?: string }>;
}) {
  const { message, verification_sent, email, next } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden font-sans bg-[#0f1218]">
      {/* Stadium Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-red-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#d4ff00]/10 blur-[110px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md border-white/10 bg-[#171b24]/90 backdrop-blur-2xl shadow-2xl relative z-10 rounded-3xl">
        {verification_sent === "true" ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="flex justify-center pb-2">
              <BrandLogo size="md" />
            </div>

            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Inbox className="w-8 h-8 text-[#d4ff00]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Check Your Email</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We sent a confirmation link to:
              </p>
              <p className="text-sm font-bold text-[#d4ff00] bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 inline-block break-all">
                {email || "your email address"}
              </p>
              <p className="text-xs text-slate-400 pt-2 leading-relaxed">
                Please click the <strong className="text-white">Confirm Email Address</strong> button in the email to activate your account and start booking courts.
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <Link href="/login" className="block w-full">
                <Button className="w-full h-12 font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-red-500/20">
                  Proceed to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/" className="block w-full">
                <Button variant="ghost" className="w-full text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                  Back to Arena Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form action={signup}>
            {next && <input type="hidden" name="next" value={next} />}
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="flex justify-center pb-2">
                <BrandLogo size="md" />
              </div>
              <CardTitle className="text-2xl font-black text-white">Join C&amp;J Pickleball</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Create your player account to reserve courts, track matches, and access leagues.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {message && (
                <div className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs p-3 rounded-xl flex items-center gap-2">
                  <p>{message}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#d4ff00]" /> Full Name
                </Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  type="text" 
                  placeholder="Juan Dela Cruz" 
                  required 
                  className="bg-slate-950 border-white/10 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#d4ff00]" /> Email Address
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="juan@example.com" 
                  required 
                  className="bg-slate-950 border-white/10 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#d4ff00]" /> Choose Password
                </Label>
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
              <Button 
                type="submit" 
                className="w-full h-12 font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/30 rounded-xl"
              >
                Create Free Player Account <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <div className="text-xs text-center text-slate-400">
                Already a player?{" "}
                <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-black text-[#d4ff00] hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}