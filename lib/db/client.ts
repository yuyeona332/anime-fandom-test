/**
 * DB client with runtime mode dispatch.
 *
 * - cloud: Neon serverless HTTP driver + pg-core schema
 * - local: libsql file mode (./data/local.db) + sqlite-core schema
 *
 * All business logic must `await getDb()`. The synchronous `db` export is
 * intentionally omitted: local mode lazily creates schema + seeds missions
 * on first call, which is async.
 *
 * The returned instance is typed as a Neon-flavored Drizzle DB to keep
 * existing call sites valid; at runtime the value is whichever flavor
 * matches the active schema (see [[./schema.ts]]).
 */

import { isLocal } from "@/lib/runtime/mode";
import * as schema from "./schema-pg";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

export type Db = NeonHttpDatabase<typeof schema>;

let dbPromise: Promise<Db> | null = null;

export async function getDb(): Promise<Db> {
  if (!dbPromise) {
    const promise = isLocal() ? initLocal() : initCloud();
    // Don't cache rejections — a transient init failure should not poison the
    // worker for its entire lifetime. Clear the cache so the next call retries.
    promise.catch(() => {
      if (dbPromise === promise) dbPromise = null;
    });
    dbPromise = promise;
  }
  return dbPromise;
}

async function initCloud(): Promise<Db> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(connectionString);
  return drizzle({ client: sql, schema });
}

async function initLocal(): Promise<Db> {
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const sqliteSchema = await import("./schema-sqlite");
  const { ensureSchema, ensureSeed } = await import("./local-init");

  const client = createClient({ url: "file:./data/local.db" });
  await ensureSchema(client);
  await ensureSeed(client);
  return drizzle(client, { schema: sqliteSchema }) as unknown as Db;
}

export { schema };
