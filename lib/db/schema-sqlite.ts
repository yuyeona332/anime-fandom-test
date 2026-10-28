/**
 * SQLite-flavored Drizzle schema parallel to schema.ts (pg-core).
 *
 * Type aliases are intentionally identical so business logic can switch
 * between schemas via lib/db/index.ts without changing types.
 *
 * Mapping decisions (vs pg-core):
 *   - uuid().defaultRandom() → text().$defaultFn(() => crypto.randomUUID())
 *   - timestamp({ withTimezone }) → integer({ mode: "timestamp_ms" })
 *   - jsonb → text({ mode: "json" })
 *   - pgEnum → text({ enum: [...] })
 *   - date → text (YYYY-MM-DD)
 *   - boolean → integer({ mode: "boolean" })
 */

import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const MISSION_LEVELS = [
  "L1_cognitive",
  "L2_home_action",
  "L3_outside_action",
  "L4_social_action",
] as const;

const MISSION_RESPONSES = ["accepted", "declined", "no_response"] as const;
const MISSION_STATUSES = ["completed", "skipped"] as const;
const RISK_ACTIONS = [
  "modal_shown",
  "soft_check_in",
  "escalated",
  "none",
] as const;

const uuidColumn = (name: string) =>
  text(name).$defaultFn(() => crypto.randomUUID());

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  ageVerified: integer("age_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  ageVerifiedAt: integer("age_verified_at", { mode: "timestamp_ms" }),
  locale: text("locale").notNull().default("ko-KR"),
  preferredMissionLevel: text("preferred_mission_level", {
    enum: MISSION_LEVELS,
  })
    .notNull()
    .default("L1_cognitive"),
  pushSubscription: text("push_subscription", { mode: "json" }).$type<
    Record<string, unknown>
  >(),
  dailyPushHour: integer("daily_push_hour").notNull().default(9),
  timezone: text("timezone").notNull().default("Asia/Seoul"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const missions = sqliteTable("missions", {
  id: uuidColumn("id").primaryKey(),
  seedId: text("seed_id").notNull().unique(),
  level: text("level", { enum: MISSION_LEVELS }).notNull(),
  category: text("category").notNull(),
  prompt: text("prompt").notNull(),
  expectedMinutes: integer("expected_minutes").notNull().default(5),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const missionAssignments = sqliteTable(
  "mission_assignments",
  {
    id: uuidColumn("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    missionId: text("mission_id")
      .notNull()
      .references(() => missions.id),
    assignedForDate: text("assigned_for_date").notNull(),
    sentAt: integer("sent_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    response: text("response", { enum: MISSION_RESPONSES })
      .notNull()
      .default("no_response"),
    respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    userDateIdx: index("mission_assignments_user_date_idx").on(
      table.userId,
      table.assignedForDate,
    ),
    userDateUnique: uniqueIndex("mission_assignments_user_date_unique").on(
      table.userId,
      table.assignedForDate,
    ),
  }),
);

export const missionLogs = sqliteTable(
  "mission_logs",
  {
    id: uuidColumn("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(() => missionAssignments.id),
    missionId: text("mission_id")
      .notNull()
      .references(() => missions.id),
    completedAt: integer("completed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    note: text("note"),
    photoUrl: text("photo_url"),
    status: text("status", { enum: MISSION_STATUSES })
      .notNull()
      .default("completed"),
  },
  (table) => ({
    userCompletedIdx: index("mission_logs_user_completed_idx").on(
      table.userId,
      table.completedAt,
    ),
  }),
);

export const riskEvents = sqliteTable(
  "risk_events",
  {
    id: uuidColumn("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    severity: integer("severity").notNull(),
    matchedKeywords: text("matched_keywords", { mode: "json" }).$type<
      string[]
    >(),
    llmJudgment: text("llm_judgment", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    action: text("action", { enum: RISK_ACTIONS }).notNull(),
    isolatedBlobRef: text("isolated_blob_ref"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userCreatedIdx: index("risk_events_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const auditLog = sqliteTable("audit_log", {
  id: uuidColumn("id").primaryKey(),
  userId: text("user_id"),
  eventType: text("event_type").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<
    Record<string, unknown>
  >(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Mission = typeof missions.$inferSelect;
export type MissionAssignment = typeof missionAssignments.$inferSelect;
export type MissionLog = typeof missionLogs.$inferSelect;
export type RiskEvent = typeof riskEvents.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
