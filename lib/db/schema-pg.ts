import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  uuid,
  date,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Mission difficulty levels (PLAN.md §Mission System)
export const missionLevelEnum = pgEnum("mission_level", [
  "L1_cognitive",
  "L2_home_action",
  "L3_outside_action",
  "L4_social_action",
]);

export const missionResponseEnum = pgEnum("mission_response", [
  "accepted",
  "declined",
  "no_response",
]);

export const missionStatusEnum = pgEnum("mission_status", [
  "completed",
  "skipped",
]);

export const riskActionEnum = pgEnum("risk_action", [
  "modal_shown",
  "soft_check_in",
  "escalated",
  "none",
]);

// Application-level user profile.
// Clerk owns identity (id matches Clerk user id). Adult-only product —
// age verification is enforced server-side before any onboarding write.
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  ageVerified: boolean("age_verified").notNull().default(false),
  ageVerifiedAt: timestamp("age_verified_at", { withTimezone: true }),
  locale: text("locale").notNull().default("ko-KR"),
  preferredMissionLevel: missionLevelEnum("preferred_mission_level")
    .notNull()
    .default("L1_cognitive"),
  pushSubscription: jsonb("push_subscription"), // Web Push endpoint + keys
  dailyPushHour: integer("daily_push_hour").notNull().default(9), // 0-23 in user TZ
  timezone: text("timezone").notNull().default("Asia/Seoul"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Soft delete — hard delete runs on 30-day cron after this is set
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Mission library (templates).
// Seed list lives in lib/missions/seed.ts. seed_id is the natural key
// the seed script uses for upserts; it stays stable across copy edits.
export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  seedId: text("seed_id").notNull().unique(),
  level: missionLevelEnum("level").notNull(),
  category: text("category").notNull(),
  prompt: text("prompt").notNull(),
  expectedMinutes: integer("expected_minutes").notNull().default(5),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row per (user, day) — what was sent and how the user responded.
export const missionAssignments = pgTable(
  "mission_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    assignedForDate: date("assigned_for_date").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    response: missionResponseEnum("response").notNull().default("no_response"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => ({
    userDateIdx: index("mission_assignments_user_date_idx").on(
      table.userId,
      table.assignedForDate,
    ),
    // One assignment per (user, day). Prevents duplicate inserts under
    // concurrent /today loads (cron retry, two-tab race, lazy assign races).
    userDateUnique: uniqueIndex("mission_assignments_user_date_unique").on(
      table.userId,
      table.assignedForDate,
    ),
  }),
);

// Completion record. Self-report only (photo/note/check) — no GPS.
// Photo URL points to Vercel Blob with private access.
export const missionLogs = pgTable(
  "mission_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: uuid("assignment_id").references(() => missionAssignments.id),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    note: text("note"), // optional one-line memo
    photoUrl: text("photo_url"), // optional Vercel Blob URL
    status: missionStatusEnum("status").notNull().default("completed"),
  },
  (table) => ({
    userCompletedIdx: index("mission_logs_user_completed_idx").on(
      table.userId,
      table.completedAt,
    ),
  }),
);

// Safety events. PLAN.md mandates separate encrypted storage for any
// utterance containing suicide/self-harm/violence content — the row
// references that storage by blobRef rather than embedding text here.
// This table is for audit and analytics only.
export const riskEvents = pgTable(
  "risk_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // "chat" | "mission_note" | "manual"
    severity: integer("severity").notNull(), // 0-10
    matchedKeywords: jsonb("matched_keywords"), // string[] of categories, not raw text
    llmJudgment: jsonb("llm_judgment"), // {model, confidence, rationale_summary}
    action: riskActionEnum("action").notNull(),
    isolatedBlobRef: text("isolated_blob_ref"), // pointer to encrypted utterance store
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("risk_events_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

// Auditable system events (signups, age-verification outcomes, data deletions).
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"), // nullable — system-level events have no user
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Mission = typeof missions.$inferSelect;
export type MissionAssignment = typeof missionAssignments.$inferSelect;
export type MissionLog = typeof missionLogs.$inferSelect;
export type RiskEvent = typeof riskEvents.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
