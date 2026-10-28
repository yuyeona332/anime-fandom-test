import { and, eq, isNull, notInArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  missionAssignments,
  missions,
  missionLogs,
  users,
} from "@/lib/db/schema";
import { recentWindow } from "@/lib/db/sql-fragments";

export interface DailyAssignmentResult {
  usersConsidered: number;
  assignmentsCreated: number;
  skipped: Array<{ userId: string; reason: string }>;
}

type MissionLevel = typeof users.$inferSelect.preferredMissionLevel;

/**
 * Idempotent daily mission assignment for every active user.
 *
 * Invoked by the /api/cron/daily-mission endpoint. Safe to retry — if
 * an assignment already exists for (user, date), the insert is a no-op.
 *
 * Selection rules:
 *   1. Honor the user's preferredMissionLevel.
 *   2. Avoid the user's most recently completed missions (last 7 days)
 *      to keep variety. Picks the oldest unused mission at that level.
 *   3. Fall back to any enabled mission at the level if all have been seen
 *      recently.
 *
 * What this function does NOT do:
 *   - Send push notifications (separate concern, see lib/push/).
 *   - Adapt level based on completion rate (Phase 3 telemetry-driven).
 */
export async function assignDailyMissions(options: {
  forDate: string;
}): Promise<DailyAssignmentResult> {
  const db = await getDb();
  const activeUsers = await db
    .select({
      id: users.id,
      preferredLevel: users.preferredMissionLevel,
    })
    .from(users)
    .where(and(eq(users.ageVerified, true), isNull(users.deletedAt)));

  const result: DailyAssignmentResult = {
    usersConsidered: activeUsers.length,
    assignmentsCreated: 0,
    skipped: [],
  };

  for (const user of activeUsers) {
    const outcome = await assignForSingleUser(user.id, {
      level: user.preferredLevel,
      forDate: options.forDate,
    });
    if (outcome.created) {
      result.assignmentsCreated += 1;
    } else {
      result.skipped.push({ userId: user.id, reason: outcome.reason });
    }
  }

  return result;
}

export interface SingleUserAssignmentResult {
  created: boolean;
  reason: string;
  assignmentId?: string;
}

/**
 * Assign one mission to one user for one date. Idempotent — returns
 * `{ created: false, reason: "already_assigned" }` if a row already exists.
 *
 * Used by both the cron loop (cloud) and lazy first-visit assignment
 * (local — see lib/missions/today.ts).
 */
export async function assignForSingleUser(
  userId: string,
  options: { level: MissionLevel; forDate: string },
): Promise<SingleUserAssignmentResult> {
  const db = await getDb();
  const existing = await db
    .select({ id: missionAssignments.id })
    .from(missionAssignments)
    .where(
      and(
        eq(missionAssignments.userId, userId),
        eq(missionAssignments.assignedForDate, options.forDate),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { created: false, reason: "already_assigned" };
  }

  const recentMissionIds = await db
    .select({ id: missionLogs.missionId })
    .from(missionLogs)
    .where(
      and(
        eq(missionLogs.userId, userId),
        recentWindow(missionLogs.completedAt, 7),
      ),
    );

  const excludeIds = recentMissionIds.map((row) => row.id);

  const candidate = await pickCandidateMission(options.level, excludeIds);

  if (!candidate) {
    return { created: false, reason: "no_mission_available" };
  }

  const inserted = await db
    .insert(missionAssignments)
    .values({
      userId,
      missionId: candidate.id,
      assignedForDate: options.forDate,
    })
    .onConflictDoNothing({
      target: [missionAssignments.userId, missionAssignments.assignedForDate],
    })
    .returning({ id: missionAssignments.id });

  if (inserted.length === 0) {
    // Lost the race — another concurrent caller inserted first. Read back.
    return { created: false, reason: "already_assigned" };
  }

  return {
    created: true,
    reason: "assigned",
    assignmentId: inserted[0].id,
  };
}

async function pickCandidateMission(
  level: MissionLevel,
  excludeIds: ReadonlyArray<string>,
): Promise<{ id: string } | null> {
  const db = await getDb();
  const baseQuery = () =>
    db
      .select({ id: missions.id })
      .from(missions)
      .where(and(eq(missions.level, level), eq(missions.enabled, true)))
      .limit(1);

  if (excludeIds.length === 0) {
    const [row] = await baseQuery();
    return row ?? null;
  }

  const [row] = await db
    .select({ id: missions.id })
    .from(missions)
    .where(
      and(
        eq(missions.level, level),
        eq(missions.enabled, true),
        notInArray(missions.id, [...excludeIds]),
      ),
    )
    .limit(1);

  if (row) {
    return row;
  }

  const [fallback] = await baseQuery();
  return fallback ?? null;
}
