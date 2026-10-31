import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_SESSION_COOKIE = "askdock_demo_session";

/**
 * Refreshes the Supabase session cookie on every dashboard/auth request and
 * keeps signed-out visitors out of /dashboard. In demo mode (no Supabase keys)
 * a simple demo-session cookie stands in for the auth session.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  let response = NextResponse.next({ request });
  let signedIn = false;

  if (SUPABASE_URL && SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } else {
    signedIn = request.cookies.get(DEMO_SESSION_COOKIE)?.value === "1";
  }

  if (isDashboard && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (isAuthPage && signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/auth/:path*"],
};
