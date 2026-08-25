"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User } from "lucide-react";
import { checkInBooking } from "@/app/actions";

type Court = { id: string; name: string };
type Booking = { id: string; start_time: string; end_time: string; status: string; profiles: { full_name: string }; courts: { id: string, name: string } };

const START_HOUR = 7;
const END_HOUR = 20;
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
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col bg-slate-50">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Front Desk</h1>
          <p className="text-slate-500">Manage court reservations and player check-ins.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border rounded-md p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center px-3 text-sm font-medium text-slate-700">
              <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
              Today
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* TIMELINE GRID */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="min-w-[1000px]">
            
            {/* Timeline Header (X-Axis) */}
            <div 
              className="grid border-b sticky top-0 z-20 bg-white"
              style={{ gridTemplateColumns: `180px repeat(${OPERATING_HOURS.length}, minmax(80px, 1fr))` }}
            >
              <div className="p-4 font-semibold text-sm text-slate-500 border-r bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Courts
              </div>
              {OPERATING_HOURS.map((hour) => (
                <div key={hour} className="p-4 text-center text-xs font-semibold text-slate-400 border-r">
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
                    className="grid border-b group hover:bg-slate-50 transition-colors h-16 relative"
                    style={{ gridTemplateColumns: `180px repeat(${OPERATING_HOURS.length}, minmax(80px, 1fr))` }}
                  >
                    {/* Fixed Court Name Column */}
                    <div className="p-4 text-sm font-medium text-slate-700 border-r bg-white group-hover:bg-slate-50 sticky left-0 z-10 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                      {court.name}
                    </div>

                    {/* Vertical Grid Lines */}
                    {OPERATING_HOURS.map((hour) => (
                      <div key={hour} className="border-r border-slate-100 h-full" />
                    ))}

                    {/* Placed Booking Blocks */}
                    {courtBookings.map((booking) => {
                      const isCheckedIn = booking.status === "checked_in";
                      
                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`absolute top-2 bottom-2 rounded-md px-3 py-1 text-xs font-medium cursor-pointer flex items-center truncate shadow-sm transition-transform hover:scale-[1.02] ${
                            isCheckedIn 
                              ? "bg-blue-100 text-blue-800 border border-blue-200" 
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                          style={{ 
                            gridColumn: getGridColumn(booking.start_time, booking.end_time),
                            gridRow: 1,
                            marginLeft: '4px',
                            marginRight: '4px'
                          }}
                        >
                          <User className="h-3 w-3 mr-1.5 opacity-70 flex-shrink-0" />
                          <span className="truncate">{booking.profiles?.full_name || "Walk-in"}</span>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Booking</DialogTitle>
            <DialogDescription>
              Details for {selectedBooking?.profiles?.full_name || "Guest"}'s session.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Court</p>
                  <p className="font-medium text-slate-900">{selectedBooking.courts?.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Status</p>
                  <Badge variant="outline" className={selectedBooking.status === "checked_in" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                    {selectedBooking.status === "checked_in" ? "Checked In" : "Awaiting Arrival"}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Time</p>
                  <p className="font-medium text-slate-900">
                    {formatHour(new Date(selectedBooking.start_time).getHours())} - {formatHour(new Date(selectedBooking.end_time).getHours())}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>Close</Button>
            {selectedBooking?.status !== "checked_in" && (
              <Button onClick={handleCheckIn} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm Check-in
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}