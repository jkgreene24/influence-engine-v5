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

  // If no user and trying to access protected routes, redirect to signin
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/signin"
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth routes, redirect appropriately
  if (user && isAuthRoute) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      const url = request.nextUrl.clone()
      if (profile?.is_admin) {
        url.pathname = "/admin"
      } else {
        url.pathname = "/chat"
      }
      return NextResponse.redirect(url)
    } catch (error) {
      console.error("Error checking admin status:", error);
      const url = request.nextUrl.clone()
      url.pathname = "/chat"
      return NextResponse.redirect(url)
    }
  }

  // Check user's admin status for route access
  if (user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, subscription_status, trial_ended, payment_method_added")
        .eq("user_id", user.id)
        .single();

      const isAdmin = profile?.is_admin;

      // Restrict admin routes to admins only
      if (isAdminRoute && !isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/chat";
        return NextResponse.redirect(url);
      }

      // Restrict user routes to non-admins only
      if (isUserRoute && isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }

      // Handle payment routes for non-admin users
      if (isPaymentRoute && !isAdmin) {
        // If user hasn't added payment method, allow access to payment setup
        if (!profile?.payment_method_added && request.nextUrl.pathname.startsWith("/payment-setup")) {
          return supabaseResponse;
        }
        
        // If user has payment method, redirect to chat
        if (profile?.payment_method_added && request.nextUrl.pathname.startsWith("/payment-setup")) {
          const url = request.nextUrl.clone();
          url.pathname = "/chat";
          return NextResponse.redirect(url);
        }
      }

      // Check trial and subscription status for non-admin users only
      if (isUserRoute && !isAdmin) {
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
      }

    } catch (error) {
      console.error("Error checking user status:", error)
      // On error, redirect to signin for safety
      const url = request.nextUrl.clone()
      url.pathname = "/auth/signin"
      return NextResponse.redirect(url)
    }
  }

  // Redirect quiz to appropriate page based on user type
  if (user && request.nextUrl.pathname.startsWith("/quiz")) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      const url = request.nextUrl.clone();
      if (profile?.is_admin) {
        url.pathname = "/admin";
      } else {
        url.pathname = "/chat";
      }
      return NextResponse.redirect(url);
    } catch (error) {
      console.error("Error checking admin status for quiz redirect:", error);
      const url = request.nextUrl.clone();
      url.pathname = "/chat";
      return NextResponse.redirect(url);
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