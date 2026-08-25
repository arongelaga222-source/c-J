import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
      <div className="max-w-3xl space-y-8">
        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
          Open 7 Days a Week in Quezon City
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
          Play Pickleball <br className="hidden md:block" />
          <span className="text-emerald-600">Anytime, Anywhere.</span>
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Premium courts, seamless booking, and a vibrant community. Reserve your spot in seconds and get ready to dink, drive, and smash.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/book">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto px-8 h-14 text-lg">
              Book a Court Now
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-14 text-lg">
            View Rates
          </Button>
        </div>
      </div>
    </div>
  );
}