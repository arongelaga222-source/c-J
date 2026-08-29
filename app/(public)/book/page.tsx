"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PickleballCourtVisualizer } from "@/components/pickleball-court-visualizer";
import { createCheckoutSession } from "@/app/actions";
import { 
  Sun, 
  Sunset, 
  Moon, 
  Trophy, 
  Clock, 
  QrCode,
  Flame
} from "lucide-react";

const COURTS = [
  { id: "c1", name: "Court 1", type: "Indoor Championship Cushion", price: 800, badge: "Air-Conditioned", spec: "8mm Poly Cushion • 850 Lux LED" },
  { id: "c2", name: "Court 2", type: "Indoor Standard Poly Court", price: 800, badge: "Air-Conditioned", spec: "6mm Poly Cushion • 850 Lux LED" },
  { id: "c3", name: "Court 3", type: "Outdoor Tournament Court", price: 650, badge: "High-Lux Lights", spec: "Acrylic Multi-Coat • Night Lights" },
  { id: "c4", name: "Court 4", type: "Outdoor Covered Training", price: 650, badge: "High-Lux Lights", spec: "Weather-Shield Canopy • High Grip" },
];

const TIME_CATEGORIES = [
  {
    title: "Morning Dink Sessions",
    icon: Sun,
    slots: ["07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"]
  },
  {
    title: "Afternoon Match Play",
    icon: Sunset,
    slots: ["01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]
  },
  {
    title: "Prime Night Lighting",
    icon: Moon,
    slots: ["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"]
  }
];

export default function BookPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCourt, setSelectedCourt] = useState(COURTS[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>("06:00 PM");
  const [paddleRental, setPaddleRental] = useState(false);

  const formattedDate = date 
    ? new Intl.DateTimeFormat('en-PH', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
      }).format(date) 
    : "Select a date";

  const rawDateStr = date ? date.toISOString().split('T')[0] : "";
  const totalAmount = selectedCourt.price + (paddleRental ? 150 : 0);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-12 space-y-8 font-sans bg-[#14161b] text-slate-100 selection:bg-red-600 selection:text-white">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black border border-amber-500/20">
          <Flame className="w-3.5 h-3.5 text-red-500" /> C&amp;J&apos;s Courts Instant Lock • QR Ph &amp; Cards
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white">Reserve a Court at C&amp;J&apos;s</h1>
        <p className="text-slate-400 text-sm md:text-base">
          Select your tournament court, playing date, and hourly time slot.
        </p>
      </div>

      {/* Main Booking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Court & Date Selection */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step 1: Select Court */}
          <Card className="border-white/10 bg-[#1c1f26]/90 backdrop-blur-md rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> 1. Choose Court
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {COURTS.map((court) => (
                <div
                  key={court.id}
                  onClick={() => setSelectedCourt(court)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedCourt.id === court.id
                      ? "border-red-500 bg-red-950/40 shadow-lg shadow-red-500/10 scale-[1.01]"
                      : "border-white/10 bg-[#14161b] hover:border-white/20"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{court.name}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {court.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{court.type}</p>
                    <p className="text-[11px] text-slate-500">{court.spec}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-400 text-base">₱{court.price}</span>
                    <span className="text-[11px] text-slate-500 block">/ hour</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Step 2: Choose Date */}
          <Card className="border-white/10 bg-[#1c1f26]/90 backdrop-blur-md rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> 2. Pick Playing Date
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pb-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => setDate(newDate)}
                className="rounded-2xl border border-white/10 bg-[#14161b] p-3 text-slate-100"
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Time Slots & Live Checkout */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 3: Available Time Intervals */}
          <Card className="border-white/10 bg-[#1c1f26]/90 backdrop-blur-md rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base font-black text-white flex items-center justify-between">
                <span>3. Time Slots for {formattedDate}</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {selectedCourt.name}
                </span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Select your 1-hour session. Yellow/Red highlights your chosen interval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {TIME_CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{cat.title}</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {cat.slots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all border ${
                              isSelected
                                ? "bg-gradient-to-r from-red-600 to-amber-500 text-white border-amber-400 shadow-md shadow-red-500/30 scale-[1.03]"
                                : "bg-[#14161b] text-slate-300 border-white/10 hover:border-red-500/50 hover:text-white"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Add-ons & Live Checkout Card */}
          <Card className="border-red-500/40 bg-gradient-to-br from-[#1c1f26] via-[#1c1f26] to-red-950/40 shadow-2xl rounded-3xl">
            <CardContent className="p-6 space-y-6">
              
              {/* Optional Pro Paddle Addon */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#14161b]">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-white block">Add C&amp;J Pro Paddle Rental</span>
                  <span className="text-xs text-slate-400">Includes 2 × 16mm Raw Carbon Paddles + 3 × 40-hole tournament balls (+₱150)</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={paddleRental ? "default" : "outline"}
                  className={paddleRental ? "bg-gradient-to-r from-red-500 to-amber-500 text-white font-black rounded-xl" : "border-white/15 text-slate-300 rounded-xl"}
                  onClick={() => setPaddleRental(!paddleRental)}
                >
                  {paddleRental ? "Added (+₱150)" : "+ Add ₱150"}
                </Button>
              </div>

              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-6">
                <div>
                  <div className="text-xs text-amber-400 font-black uppercase tracking-wider">
                    {selectedCourt.name} • {selectedSlot || "No slot selected"}
                  </div>
                  <div className="text-2xl font-black text-white">
                    ₱{totalAmount.toFixed(2)}
                    <span className="text-xs text-slate-400 font-semibold ml-2">Total amount</span>
                  </div>
                  <p className="text-xs text-slate-400">{formattedDate} • 1 Hour Session</p>
                </div>

                <form action={createCheckoutSession} className="w-full sm:w-auto">
                  <input type="hidden" name="date" value={rawDateStr} />
                  <input type="hidden" name="slot" value={selectedSlot || "06:00 PM"} />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!selectedSlot}
                    className="w-full sm:w-auto h-12 px-8 font-black bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-red-500/30 rounded-xl flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" /> Pay with QR Ph / Card
                  </Button>
                </form>
              </div>

            </CardContent>
          </Card>

          {/* Court Preview Section */}
          <PickleballCourtVisualizer interactive={false} selectedCourtName={selectedCourt.name} />

        </div>
      </div>
    </div>
  );
}