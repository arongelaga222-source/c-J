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

  if (profile?.role !== 'admin') redirect('/dashboard');

  // Fetch all courts
  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header & Add Court Modal */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Courts</h1>
          <p className="text-slate-500">Configure venue facilities and control availability status.</p>
        </div>

        <Dialog>
          <DialogTrigger>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add New Court
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form action={createCourt}>
              <DialogHeader>
                <DialogTitle>Add Court</DialogTitle>
                <DialogDescription>
                  Enter the name or identifier for the new pickleball court.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Court Name</Label>
                  <Input id="name" name="name" placeholder="Court 2 (Tournament)" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Save Court
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Facilities</CardTitle>
          <CardDescription>Active courts appear on the customer booking calendar and cashier timeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility Name</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!courts || courts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-slate-500">
                    No courts found. Add your first court above.
                  </TableCell>
                </TableRow>
              ) : (
                courts.map((court) => {
                  const isMaintenance = court.status === 'maintenance';

                  return (
                    <TableRow key={court.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        {court.name}
                      </TableCell>
                      <TableCell>
                        {isMaintenance ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Maintenance
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={async () => {
                          "use server";
                          await toggleCourtStatus(court.id, court.status);
                        }}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="submit"
                            className={isMaintenance ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-amber-200 text-amber-700 hover:bg-amber-50"}
                          >
                            {isMaintenance ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Set Active</>
                            ) : (
                              <><Wrench className="h-3 w-3 mr-1" /> Set Maintenance</>
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