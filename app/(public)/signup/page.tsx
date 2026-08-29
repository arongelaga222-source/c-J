import Link from "next/link";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { signup } from "@/app/actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Red & Gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-red-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative z-10 rounded-3xl">
        <form action={signup}>
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center pb-2">
              <BrandLogo size="md" />
            </div>
            <CardTitle className="text-2xl font-black text-white">Join C&amp;J&apos;s Courts</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Create your player account to reserve courts and access tournaments.
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
                <User className="w-3.5 h-3.5 text-amber-400" /> Full Name
              </Label>
              <Input 
                id="fullName" 
                name="fullName" 
                type="text" 
                placeholder="Juan Dela Cruz" 
                required 
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> Email Address
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="juan@example.com" 
                required 
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl focus-visible:ring-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Choose Password
              </Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="bg-slate-950 border-slate-800 text-slate-100 rounded-xl focus-visible:ring-red-500"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/30 rounded-xl"
            >
              Create Player Account <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <div className="text-xs text-center text-slate-400">
              Already a member?{" "}
              <Link href="/login" className="font-black text-amber-400 hover:underline">
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}