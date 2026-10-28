/**
 * Cookie-based guest session for local mode.
 *
 * The cookie name is the only contract — middleware sets it on first
 * request (read-only routes can't mutate cookies cleanly in Next.js
 * App Router server components), and server-side code reads it.
 *
 * If the cookie is missing when a server component reads it, that means
 * middleware didn't run (e.g., a code path that bypasses middleware) —
 * we return null and the caller can decide.
 */

import { cookies } from "next/headers";

export const LOCAL_USER_COOKIE = "cc_dev_user";

export async function readLocalUserCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(LOCAL_USER_COOKIE)?.value;
  return value && value.length > 0 ? value : null;
}
