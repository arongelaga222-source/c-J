import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 1. Basic Auth Check for all private routes
  const isProtectedRoute =
    pathname.startsWith('/cashier') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Role-Based Access Control (RBAC)
  if (user && (pathname.startsWith('/cashier') || pathname.startsWith('/admin'))) {
    // Fetch the user's role from the public.profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'
    const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'
    const isStaff = isOwnerOrAdmin || userRole === 'cashier'

    // Admin/Owner Route Protection: Only Admins and Owners allowed
    if (pathname.startsWith('/admin') && !isOwnerOrAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Cashier Route Protection: Admins, Owners and Cashiers allowed
    if (pathname.startsWith('/cashier') && !isStaff) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // 3. Redirect logged-in users away from auth pages
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}