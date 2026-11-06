/**
 * Cookie names shared by the middleware, auth and the in-memory workspace.
 * Kept dependency-free so the (edge) middleware can import it.
 */

/** Set to "1" while a visitor is signed in to the in-memory workspace (no Supabase). */
export const SESSION_COOKIE = "askdock_session";

/** Random id of the visitor's private in-memory workspace (no Supabase). */
export const WORKSPACE_COOKIE = "askdock_ws";

export const WORKSPACE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const cookieOptions = (maxAgeDays: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * maxAgeDays,
});
