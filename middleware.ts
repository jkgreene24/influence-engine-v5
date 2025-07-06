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
  
  const isAdminRoute = adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isUserRoute = userRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isProtectedRoute = isAdminRoute || isUserRoute

  // If no user and trying to access protected routes, redirect to signin
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/signin"
    return NextResponse.redirect(url)
  }

  // If user is signed in and tries to access auth pages (except email-confirmed), redirect based on role
  if (user && isAuthRoute && !request.nextUrl.pathname.startsWith("/auth/email-confirmed")) {
    const url = request.nextUrl.clone()
    
    // Get user profile to check admin status
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single()
      
      if (profile?.is_admin) {
        url.pathname = "/admin"
      } else {
        url.pathname = "/chat"
      }
    } catch (error) {
      // If profile not found, default to chat
      url.pathname = "/chat"
    }
    
    return NextResponse.redirect(url)
  }

  // Role-based access control for authenticated users
  if (user && isProtectedRoute) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single()
      
      const isAdmin = profile?.is_admin || false
      
      // Admin users can only access admin routes
      if (isAdmin && !isAdminRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }
      
      // Regular users can only access user routes
      if (!isAdmin && !isUserRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/chat"
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If profile not found, redirect to chat
      if (isAdminRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/chat"
        return NextResponse.redirect(url)
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

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