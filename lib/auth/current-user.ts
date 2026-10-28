/**
 * Auth adapter: returns the current user id regardless of mode.
 *
 * - cloud: Clerk's auth() — dynamically imported so missing-env at module
 *   load doesn't crash local builds
 * - local: cookie-based guest id set by middleware
 */

import { isLocal } from "@/lib/runtime/mode";
import { readLocalUserCookie } from "./local-cookie";

export async function getCurrentUserIdOrNull(): Promise<string | null> {
  if (isLocal()) {
    return readLocalUserCookie();
  }
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId ?? null;
}

export async function getCurrentUserId(): Promise<string> {
  const id = await getCurrentUserIdOrNull();
  if (!id) {
    throw new Error("unauthenticated");
  }
  return id;
}
