/**
 * First-boot setup for local SQLite mode: schema creation + mission seed.
 *
 * Runs once per worker, gated by an in-memory promise. Cheap to retry —
 * all statements are idempotent.
 */

import type { Client } from "@libsql/client";
import { missionSeed } from "@/lib/missions/seed";

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    age_verified INTEGER NOT NULL DEFAULT 0,
    age_verified_at INTEGER,
    locale TEXT NOT NULL DEFAULT 'ko-KR',
    preferred_mission_level TEXT NOT NULL DEFAULT 'L1_cognitive',
    push_subscription TEXT,
    daily_push_hour INTEGER NOT NULL DEFAULT 9,
    timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
    created_at INTEGER NOT NULL,
    deleted_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    seed_id TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL,
    category TEXT NOT NULL,
    prompt TEXT NOT NULL,
    expected_minutes INTEGER NOT NULL DEFAULT 5,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mission_assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL REFERENCES missions(id),
    assigned_for_date TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    response TEXT NOT NULL DEFAULT 'no_response',
    responded_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS mission_assignments_user_date_idx
    ON mission_assignments(user_id, assigned_for_date)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS mission_assignments_user_date_unique
    ON mission_assignments(user_id, assigned_for_date)`,
  `CREATE TABLE IF NOT EXISTS mission_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id TEXT REFERENCES mission_assignments(id),
    mission_id TEXT NOT NULL REFERENCES missions(id),
    completed_at INTEGER NOT NULL,
    note TEXT,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'completed'
  )`,
  `CREATE INDEX IF NOT EXISTS mission_logs_user_completed_idx
    ON mission_logs(user_id, completed_at)`,
  `CREATE TABLE IF NOT EXISTS risk_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    severity INTEGER NOT NULL,
    matched_keywords TEXT,
    llm_judgment TEXT,
    action TEXT NOT NULL,
    isolated_blob_ref TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS risk_events_user_created_idx
    ON risk_events(user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    event_type TEXT NOT NULL,
    metadata TEXT,
    created_at INTEGER NOT NULL
  )`,
];

export async function ensureSchema(client: Client): Promise<void> {
  for (const statement of DDL_STATEMENTS) {
    await client.execute(statement);
  }
}

export async function ensureSeed(client: Client): Promise<void> {
  const result = await client.execute("SELECT COUNT(*) AS n FROM missions");
  const count = Number(result.rows[0]?.n ?? 0);
  if (count >= missionSeed.length) return;

  const now = Date.now();
  for (const entry of missionSeed) {
    await client.execute({
      sql: `INSERT INTO missions (id, seed_id, level, category, prompt, expected_minutes, enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(seed_id) DO NOTHING`,
      args: [
        crypto.randomUUID(),
        entry.id,
        entry.level,
        entry.category,
        entry.prompt,
        entry.expectedMinutes,
        now,
      ],
    });
  }
}
