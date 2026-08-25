"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/app/actions";

const AVAILABLE_SLOTS = [
  "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

export default function BookPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const formattedDate = date 
    ? new Intl.DateTimeFormat('en-PH', { 
        weekday: 'long', month: 'long', day: 'numeric' 
      }).format(date) 
    : "Select a date";

  // Raw date string to pass to the backend
  const rawDateStr = date ? date.toISOString().split('T')[0] : "";

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reserve a Court</h1>
        <p className="text-slate-600 mt-2">Select a date and time to lock in your play session.</p>
      </div>

      <div className="grid md:grid-cols-[350px_1fr] gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Pick a Date</CardTitle>
            <CardDescription>Courts can be booked up to 14 days in advance.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                setSelectedSlot(null);
              }}
              className="rounded-md border shadow-sm"
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} 
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Times for {formattedDate}</CardTitle>
              <CardDescription>Showing all available 1-hour slots for standard courts.</CardDescription>
            </CardHeader>
            <CardContent>
              {date ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AVAILABLE_SLOTS.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedSlot === slot ? "default" : "outline"}
                      className={
                        selectedSlot === slot 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                          : "text-slate-700 hover:text-emerald-700 hover:border-emerald-200"
                      }
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                  Please select a date from the calendar to view availability.
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSlot && (
            <Card className="border-emerald-200 bg-emerald-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold text-emerald-900">You selected: {selectedSlot}</h3>
                  <p className="text-sm text-emerald-700">{formattedDate} • 1 Hour Session • ₱800.00</p>
                </div>
                
                {/* Submit to PayMongo Action */}
                <form action={createCheckoutSession} className="w-full sm:w-auto mt-4 sm:mt-0">
                  <input type="hidden" name="date" value={rawDateStr} />
                  <input type="hidden" name="slot" value={selectedSlot} />
                  <Button 
                    type="submit"
                    size="lg" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full shadow-md"
                  >
                    Pay with QR Ph
                  </Button>
                </form>

              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}