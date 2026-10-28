/**
 * Dialect-aware SQL fragments. Drizzle's typed query builder doesn't cover
 * every PG-specific feature (e.g., `interval`), so when we drop down to
 * raw SQL we need to branch on the active mode.
 */

import { sql, type SQL, type AnyColumn } from "drizzle-orm";
import { isLocal } from "@/lib/runtime/mode";

/**
 * "column > (now - N days)" predicate that works in both Postgres and SQLite.
 *
 * - Postgres: `column > now() - interval 'N days'`
 * - SQLite: stored timestamps are unix ms (Drizzle `timestamp_ms` mode),
 *   so compare against (now_ms - N * 86_400_000).
 */
export function recentWindow(column: AnyColumn, days: number): SQL {
  // Defense in depth: sql.raw bypasses parameterization. Guard against any
  // future caller passing user-influenced or non-finite values.
  if (!Number.isInteger(days) || days < 0 || days > 3650) {
    throw new Error(`recentWindow: invalid days argument (${days})`);
  }
  if (isLocal()) {
    const cutoff = Date.now() - days * 86_400_000;
    return sql`${column} > ${cutoff}`;
  }
  return sql`${column} > now() - interval '${sql.raw(String(days))} days'`;
}
