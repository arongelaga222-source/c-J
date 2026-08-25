import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CashierClient from "./cashier-client";

export default async function CashierDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch Inventory Only
  const { data: products } = await supabase
    .from('pos_products')
    .select('*')
    .order('category', { ascending: true });

  return (
    <CashierClient initialProducts={products || []} />
  );
}