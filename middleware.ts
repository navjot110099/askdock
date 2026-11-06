import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions, SESSION_COOKIE, WORKSPACE_COOKIE, WORKSPACE_ID } from "@/lib/session-cookies";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * With Supabase: refreshes the auth session on dashboard/auth requests and
 * keeps signed-out visitors out of /dashboard.
 *
 * Without Supabase (in-memory workspaces): gives every visitor a private
 * workspace id cookie on their first page view, and uses a session cookie in
 * place of the auth session.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  let response = NextResponse.next({ request });
  let signedIn = false;
  let newWorkspace: string | null = null;

  if (hasSupabase) {
    if (!isDashboard && !isAuthPage && !pathname.startsWith("/auth")) return response;
    const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
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
    signedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";
    if (!WORKSPACE_ID.test(request.cookies.get(WORKSPACE_COOKIE)?.value ?? "")) {
      // Forward the id to this request's render too, so the first page view already uses it.
      newWorkspace = crypto.randomUUID();
      request.cookies.set(WORKSPACE_COOKIE, newWorkspace);
      response = NextResponse.next({ request });
    }
  }

  if (isDashboard && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    response = NextResponse.redirect(url);
  } else if (isAuthPage && signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    response = NextResponse.redirect(url);
  }

  if (newWorkspace) response.cookies.set(WORKSPACE_COOKIE, newWorkspace, cookieOptions(30));
  return response;
}

export const config = {
  matcher: ["/", "/widget-demo", "/dashboard/:path*", "/login", "/signup", "/auth/:path*"],
};
