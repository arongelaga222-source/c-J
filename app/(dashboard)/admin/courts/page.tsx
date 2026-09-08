import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wrench, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
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

  const activeCount = courts?.filter((c) => c.is_active !== false && c.status !== 'maintenance').length || 0;
  const maintenanceCount = (courts?.length || 0) - activeCount;

  return (
    <div className="p-6 sm:p-10 max-w-[1440px] mx-auto space-y-8 text-[#111111] font-sans bg-white">
      
      {/* Header & Add Court Modal */}
      <div className="flex flex-col md:flex-row items-start md:items-baseline justify-between gap-4 border-b border-[#cacacb] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#707072]">
              Administration
            </span>
            <span className="text-xs text-[#cacacb]">•</span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#111111] border border-[#cacacb]">
              Facility Management
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-[#111111]">
            COURT &amp; ARENA INFRASTRUCTURE
          </h1>
          <p className="text-xs text-[#707072] mt-1">
            Configure championship courts, hourly rate structures, and availability schedules.
          </p>
        </div>

        <Dialog>
          <DialogTrigger
            render={
              <Button size="sm" className="bg-[#111111] text-white hover:bg-[#222222] h-10 px-5 text-xs font-medium rounded-full">
                <Plus className="h-4 w-4 mr-2" /> Add New Court
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md bg-white border border-[#cacacb] text-[#111111] rounded-none p-6 sm:p-8 shadow-2xl">
            <form action={createCourt}>
              <DialogHeader className="space-y-1 pb-2">
                <DialogTitle className="text-2xl font-bold tracking-tight text-[#111111]">
                  Commission Court Facility
                </DialogTitle>
                <DialogDescription className="text-xs text-[#707072]">
                  Enter the facility details and hourly rate for the new pickleball court.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    Court Name / Identifier
                  </Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g. Court 3 - Indoor (Pro Cushion)" 
                    required 
                    className="h-10 px-4 rounded-full bg-[#f5f5f5] text-xs text-[#111111] border-transparent focus:border-[#111111]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rate" className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    Hourly Rate (PHP)
                  </Label>
                  <Input 
                    id="rate" 
                    name="rate" 
                    type="number" 
                    defaultValue="300" 
                    min="1" 
                    step="1" 
                    required 
                    className="h-10 px-4 rounded-full bg-[#f5f5f5] text-xs text-[#111111] border-transparent focus:border-[#111111]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-10 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-semibold text-xs transition-colors">
                  Save &amp; Activate Court
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#cacacb] p-6 bg-white space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#707072]">Total Facilities</p>
          <div className="text-4xl font-display uppercase tracking-tight text-[#111111]">
            {courts?.length || 0}
          </div>
          <p className="text-[11px] text-[#707072]">Registered championship courts</p>
        </div>

        <div className="border border-[#cacacb] p-6 bg-white space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#007d48]">Active Online</p>
          <div className="text-4xl font-display uppercase tracking-tight text-[#007d48]">
            {activeCount}
          </div>
          <p className="text-[11px] text-[#707072]">Available on booking engine</p>
        </div>

        <div className="border border-[#cacacb] p-6 bg-white space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#d30005]">Maintenance / Inactive</p>
          <div className="text-4xl font-display uppercase tracking-tight text-[#d30005]">
            {maintenanceCount}
          </div>
          <p className="text-[11px] text-[#707072]">Offline for servicing</p>
        </div>
      </div>

      {/* Courts Table */}
      <Card className="border border-[#cacacb] bg-white rounded-none overflow-hidden shadow-none">
        <CardHeader className="border-b border-[#cacacb] bg-[#f5f5f5] p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold uppercase tracking-tight text-[#111111]">
                Arena Court Inventory
              </CardTitle>
              <CardDescription className="text-xs text-[#707072] mt-0.5">
                Active courts automatically publish to the player reservation portal and cashier POS timeline.
              </CardDescription>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#707072] hidden sm:inline-block">
              Real-time Status
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-[#cacacb]">
              <TableRow className="border-[#cacacb]">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Facility Name</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Hourly Tariff</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Operational Status</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#707072] h-12">Action Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!courts || courts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-[#707072] text-xs font-medium">
                    No courts found. Commission your first court above.
                  </TableCell>
                </TableRow>
              ) : (
                courts.map((court) => {
                  const isActive = court.is_active !== false && court.status !== 'maintenance';

                  return (
                    <TableRow key={court.id} className="border-b border-[#cacacb] hover:bg-[#f5f5f5]/60 transition-colors">
                      <TableCell className="font-bold text-[#111111] py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] border border-[#cacacb] flex items-center justify-center shrink-0">
                            <MapPin className="h-4 w-4 text-[#111111]" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-[#111111] block">{court.name}</span>
                            <span className="text-[10px] text-[#707072] font-mono">ID: {court.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-[#111111] py-4">
                        ₱{Number(court.hourly_rate || 300).toFixed(2)} <span className="text-xs text-[#707072] font-normal">/ hour</span>
                      </TableCell>
                      <TableCell className="py-4">
                        {!isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f5] text-[#d30005] border border-[#d30005]/30 text-[11px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d30005]" />
                            Maintenance / Offline
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f5] text-[#007d48] border border-[#007d48]/30 text-[11px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#007d48]" />
                            Active Online
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <form action={async () => {
                          "use server";
                          await toggleCourtStatus(court.id, isActive);
                        }}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="submit"
                            className={!isActive 
                              ? "border-[#007d48]/40 bg-white text-[#007d48] hover:bg-[#f5f5f5] text-xs font-semibold rounded-full h-8 px-4" 
                              : "border-[#d30005]/40 bg-white text-[#d30005] hover:bg-[#f5f5f5] text-xs font-semibold rounded-full h-8 px-4"}
                          >
                            {!isActive ? (
                              <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-[#007d48]" /> Bring Online</>
                            ) : (
                              <><Wrench className="h-3.5 w-3.5 mr-1.5 text-[#d30005]" /> Set Maintenance</>
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