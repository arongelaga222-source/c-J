"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Trophy, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { checkInBooking } from "@/app/actions";

type Court = { id: string; name: string };
type Booking = { id: string; start_time: string; end_time: string; status: string; profiles: { full_name: string }; courts: { id: string, name: string } };

const START_HOUR = 7;
const END_HOUR = 22;
const OPERATING_HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

export default function ScheduleClient({ 
  todaysBookings,
  courts
}: { 
  todaysBookings: Booking[];
  courts: Court[];
}) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    await checkInBooking(selectedBooking.id);
    setSelectedBooking(null);
  };

  const formatHour = (hour: number) => {
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const getGridColumn = (startTime: string, endTime: string) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const startCol = Math.max(startDate.getHours() - START_HOUR + 2, 2); 
    const endCol = Math.max(endDate.getHours() - START_HOUR + 2, startCol + 1);
    return `${startCol} / ${endCol}`;
  };

  return (
    <div className="p-6 h-[calc(100vh)] flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">Daily Court Timeline</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time C&amp;J&apos;s court schedule and player check-in desk.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white rounded-xl">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-3 text-xs font-bold text-slate-200">
              <CalendarIcon className="h-3.5 w-3.5 mr-2 text-amber-400" />
              Today&apos;s Timeline
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white rounded-xl">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* TIMELINE GRID */}
      <div className="flex-1 bg-slate-900/70 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-0 backdrop-blur-md">
        <ScrollArea className="flex-1">
          <div className="min-w-[1100px]">
            
            {/* Timeline Header (X-Axis) */}
            <div 
              className="grid border-b border-slate-800 sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md"
              style={{ gridTemplateColumns: `200px repeat(${OPERATING_HOURS.length}, minmax(85px, 1fr))` }}
            >
              <div className="p-4 font-black text-xs uppercase tracking-wider text-amber-400 border-r border-slate-800 bg-slate-950/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                Courts
              </div>
              {OPERATING_HOURS.map((hour) => (
                <div key={hour} className="p-4 text-center text-xs font-bold text-slate-400 border-r border-slate-800/60">
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Timeline Rows (Y-Axis) */}
            <div className="relative">
              {courts.map((court) => {
                const courtBookings = todaysBookings.filter(b => b.courts?.id === court.id);

                return (
                  <div 
                    key={court.id} 
                    className="grid border-b border-slate-800/70 group hover:bg-slate-800/30 transition-colors h-16 relative"
                    style={{ gridTemplateColumns: `200px repeat(${OPERATING_HOURS.length}, minmax(85px, 1fr))` }}
                  >
                    {/* Fixed Court Name Column */}
                    <div className="p-4 text-xs font-bold text-white border-r border-slate-800 bg-slate-950/90 group-hover:bg-slate-900/90 sticky left-0 z-10 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-500" />
                      {court.name}
                    </div>

                    {/* Vertical Grid Lines */}
                    {OPERATING_HOURS.map((hour) => (
                      <div key={hour} className="border-r border-slate-800/40 h-full" />
                    ))}

                    {/* Placed Booking Blocks */}
                    {courtBookings.map((booking) => {
                      const isCheckedIn = booking.status === "checked_in";
                      
                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`absolute top-2 bottom-2 rounded-xl px-3 py-1 text-xs font-bold cursor-pointer flex items-center truncate shadow-lg transition-transform hover:scale-[1.02] border ${
                            isCheckedIn 
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10" 
                              : "bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/10"
                          }`}
                          style={{ 
                            gridColumn: getGridColumn(booking.start_time, booking.end_time),
                            gridRow: 1,
                            marginLeft: '4px',
                            marginRight: '4px'
                          }}
                        >
                          <User className="h-3 w-3 mr-1.5 opacity-80 shrink-0 text-amber-400" />
                          <span className="truncate">{booking.profiles?.full_name || "Walk-in Guest"}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Booking Action Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Manage Court Booking
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Reservation details for {selectedBooking?.profiles?.full_name || "Walk-in Player"}.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-slate-500 font-bold mb-1">Reserved Court</p>
                  <p className="font-black text-white">{selectedBooking.courts?.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1">Arrival Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedBooking.status === "checked_in" 
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" 
                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}>
                    {selectedBooking.status === "checked_in" ? "Checked In" : "Awaiting Arrival"}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1">Session Hours</p>
                  <p className="font-black text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {formatHour(new Date(selectedBooking.start_time).getHours())} - {formatHour(new Date(selectedBooking.end_time).getHours())}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedBooking(null)} className="border-slate-800 text-slate-300 rounded-xl">
              Close
            </Button>
            {selectedBooking?.status !== "checked_in" && (
              <Button onClick={handleCheckIn} className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-black rounded-xl">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm Player Check-in
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}