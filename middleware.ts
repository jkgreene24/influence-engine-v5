import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define route access rules
  const adminRoutes = ["/admin", "/admin-chat"]
  const userRoutes = ["/chat", "/profile", "/subscription"]
  const authRoutes = ["/auth/signin", "/auth/signup", "/auth/callback", "/auth/auth-code-error", "/auth/email-confirmed"]
  const paymentRoutes = ["/payment-setup", "/payment-success"]
  
  const isAdminRoute = adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isUserRoute = userRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isPaymentRoute = paymentRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isProtectedRoute = isAdminRoute || isUserRoute || isPaymentRoute

  // Restrict admin routes to admins only
  if (user && isAdminRoute) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      if (!profile?.is_admin) {
        const url = request.nextUrl.clone();
        url.pathname = "/chat";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      const url = request.nextUrl.clone();
      url.pathname = "/chat";
      return NextResponse.redirect(url);
    }
  }

  // If no user and trying to access protected routes, redirect to signin
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/signin"
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth routes, redirect to chat
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/chat"
    return NextResponse.redirect(url)
  }

  // Check trial and subscription status for user routes (not admin routes)
  if (user && isUserRoute) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ended, is_admin, payment_method_added")
        .eq("user_id", user.id)
        .single()

      // Skip trial/subscription checks for admin users
      if (profile?.is_admin) {
        return supabaseResponse
      }

      // If user hasn't added payment method, redirect to payment setup
      if (!profile?.payment_method_added) {
        const url = request.nextUrl.clone()
        url.pathname = "/payment-setup"
        return NextResponse.redirect(url)
      }

      // Trial and subscription logic
      if (
        !profile?.subscription_status &&
        profile?.trial_ended &&
        !request.nextUrl.pathname.startsWith("/subscription")
      ) {
        // Only redirect if NOT already on the subscription page
        const url = request.nextUrl.clone()
        url.pathname = "/subscription"
        url.searchParams.set("upgrade", "true")
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error("Error checking trial/subscription status:", error)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}