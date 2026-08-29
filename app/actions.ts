'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Helper function to handle role-based redirection
async function redirectBasedOnRole(userId: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = profile?.role || 'customer'

  revalidatePath('/', 'layout')

  if (role === 'admin') {
    redirect('/admin')
  } else if (role === 'cashier') {
    redirect('/cashier/schedule')
  } else {
    redirect('/dashboard')
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const errorMessage = (error as Error).message;
    console.error('Login error:', errorMessage);
    return redirect(`/login?message=${encodeURIComponent(errorMessage)}`);
  }

  // Check user role and route accordingly
  if (data?.user) {
    await redirectBasedOnRole(data.user.id)
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    const errorMessage = (error as Error).message;
    console.error('Signup error:', errorMessage);
    return redirect(`/signup?message=${encodeURIComponent(errorMessage)}`);
  }

  // New signups default to 'customer', but we check dynamically just in case
  if (data?.user) {
    await redirectBasedOnRole(data.user.id)
  }

  redirect('/dashboard')
}

export async function createCheckoutSession(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login?returnTo=/book')

  const date = formData.get('date') as string
  const slot = formData.get('slot') as string
  const amount = 800 // ₱800.00
  
  // 2. Fetch the first available court to use for the mock booking
  const { data: court } = await supabase
    .from('courts')
    .select('id')
    .limit(1)
    .single();

  if (court) {
    const timeMatch = slot.match(/(\d+):(\d+)\s(AM|PM)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      if (timeMatch[3] === 'PM' && hours !== 12) hours += 12;
      if (timeMatch[3] === 'AM' && hours === 12) hours = 0;
      
      const startTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:00:00+08:00`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      await supabase.from('bookings').insert({
        customer_id: user.id,
        court_id: court.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'paid',
        total_amount: amount
      });
    }
  }

  redirect('/dashboard?payment=success');
}

export async function processPosTransaction(
  cart: { id: string; price: number; quantity: number }[],
  total: number,
  paymentMethod: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Insert the main transaction record
  const { data: transaction, error: txError } = await supabase
    .from('pos_transactions')
    .insert({
      cashier_id: user.id,
      total_amount: total,
      payment_method: paymentMethod
    })
    .select()
    .single();

  if (txError || !transaction) throw new Error("Failed to process transaction");

  // 2. Prepare and insert the line items
  const lineItems = cart.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.id,
    quantity: item.quantity,
    price_at_time: item.price
  }));

  const { error: itemsError } = await supabase
    .from('pos_transaction_items')
    .insert(lineItems);

  if (itemsError) throw new Error("Failed to record items");

  revalidatePath('/cashier');
  return { success: true, transactionId: transaction.id };
}

export async function checkInBooking(bookingId: string) {
  const supabase = await createClient();
  await supabase
    .from('bookings')
    .update({ status: 'checked_in' })
    .eq('id', bookingId);
    
  revalidatePath('/cashier/schedule');
}

export async function createCashierAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  // Verify Admin Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized: Admin access required.");

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (createError) {
    console.error("Create User Error:", createError.message);
    throw new Error(createError.message);
  }

  if (newUser.user) {
    await adminSupabase
      .from('profiles')
      .update({ role: 'cashier', full_name: fullName })
      .eq('id', newUser.user.id);
  }

  revalidatePath('/admin');
  // Remove the return object statement to satisfy React form action types
}

// 2. Admin Action to Void a POS Transaction
export async function voidTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  // Verify Admin Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");

  // Mark transaction as voided
  const { error } = await supabase
    .from('pos_transactions')
    .update({ status: 'voided' })
    .eq('id', transactionId);

  if (error) throw new Error("Failed to void transaction");

  revalidatePath('/admin');
}

// --- Add this to the bottom of app/actions.ts ---

export async function createCourt(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  // Verify Admin Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");

  const name = formData.get('name') as string;

  const { error } = await supabase
    .from('courts')
    .insert({ name, status: 'active' });

  if (error) throw new Error("Failed to create court");

  revalidatePath('/admin/courts');
}

export async function toggleCourtStatus(courtId: string, currentStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");

  const newStatus = currentStatus === 'active' ? 'maintenance' : 'active';

  const { error } = await supabase
    .from('courts')
    .update({ status: newStatus })
    .eq('id', courtId);

  if (error) throw new Error("Failed to update court status");

  revalidatePath('/admin/courts');
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}