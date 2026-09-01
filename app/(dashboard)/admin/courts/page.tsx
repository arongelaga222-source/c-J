import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Wrench, CheckCircle2 } from "lucide-react";
import { createCourt, toggleCourtStatus } from "@/app/actions";

export default async function AdminCourtsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // Fetch all courts
  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 text-slate-100 font-sans">
      
      {/* Header & Add Court Modal */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Manage Courts</h1>
          <p className="text-xs text-slate-400 mt-1">Configure venue facilities, rates, and active/maintenance availability.</p>
        </div>

        <Dialog>
          <DialogTrigger>
            <Button className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20">
              <Plus className="h-4 w-4 mr-2" /> Add New Court
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
            <form action={createCourt}>
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">Add New Court</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  Enter the facility details and hourly rate for the new pickleball court.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-300">Court Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g. Court 3 - Indoor (Pro Cushion)" 
                    required 
                    className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-xs font-bold text-slate-300">Hourly Rate (PHP)</Label>
                  <Input 
                    id="rate" 
                    name="rate" 
                    type="number" 
                    defaultValue="300" 
                    min="1" 
                    step="1" 
                    required 
                    className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-red-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">
                  Save Court
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courts Table */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/50 p-6">
          <CardTitle className="text-lg font-black text-white">Venue Facilities</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Active courts appear on the customer booking calendar and cashier timeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/70 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="text-xs font-black text-slate-400">Facility Name</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Hourly Rate</TableHead>
                <TableHead className="text-xs font-black text-slate-400">Current Status</TableHead>
                <TableHead className="text-right text-xs font-black text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!courts || courts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500 text-xs font-medium">
                    No courts found. Add your first court above.
                  </TableCell>
                </TableRow>
              ) : (
                courts.map((court) => {
                  const isActive = court.is_active !== false && court.status !== 'maintenance';

                  return (
                    <TableRow key={court.id} className="border-slate-800/80 hover:bg-slate-800/40">
                      <TableCell className="font-bold text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        {court.name}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-300">
                        ₱{Number(court.hourly_rate || 300).toFixed(2)}/hr
                      </TableCell>
                      <TableCell>
                        {!isActive ? (
                          <Badge variant="outline" className="bg-amber-950/40 text-amber-400 border-amber-500/30 text-[11px] font-bold">
                            Maintenance / Offline
                          </Badge>
                        ) : (
                          <Badge className="bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30 text-[11px] font-bold">
                            Active Online
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={async () => {
                          "use server";
                          await toggleCourtStatus(court.id, isActive);
                        }}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="submit"
                            className={!isActive ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 text-xs font-bold rounded-xl" : "border-amber-500/30 bg-amber-950/30 text-amber-400 hover:bg-amber-900/40 text-xs font-bold rounded-xl"}
                          >
                            {!isActive ? (
                              <><CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Set Active</>
                            ) : (
                              <><Wrench className="h-3.5 w-3.5 mr-1 text-amber-400" /> Set Maintenance</>
                            )}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}