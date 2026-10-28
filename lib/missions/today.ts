import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { missionAssignments, missions, users } from "@/lib/db/schema";
import type { MissionLevel } from "./types";
import { assignForSingleUser } from "./assign";

export interface TodayMissionView {
  assignmentId: string;
  missionId: string;
  level: MissionLevel;
  prompt: string;
  expectedMinutes: number;
  response: "accepted" | "declined" | "no_response";
  assignedForDate: string;
}

/**
 * Fetch the user's mission assignment for today.
 *
 * If no assignment exists, we attempt a lazy assignment right here. In
 * cloud mode this is a safety net for cron failures; in local mode it is
 * the only assignment path (there is no cron in dev).
 *
 * Returns null only if every level's mission pool is empty for this user.
 */
export async function getTodayMission(
  userId: string,
): Promise<TodayMissionView | null> {
  const today = todayInUserTimezone(userId);
  const db = await getDb();

  let row = await fetchAssignment(userId, today);

  if (!row) {
    const [profile] = await db
      .select({ level: users.preferredMissionLevel })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const level: MissionLevel = profile?.level ?? "L1_cognitive";
    await assignForSingleUser(userId, { level, forDate: today });
    row = await fetchAssignment(userId, today);
  }

  if (!row) {
    return null;
  }

  return {
    assignmentId: row.assignmentId,
    missionId: row.missionId,
    level: row.level,
    prompt: row.prompt,
    expectedMinutes: row.expectedMinutes,
    response: row.response,
    assignedForDate: row.assignedForDate,
  };
}

async function fetchAssignment(userId: string, date: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      assignmentId: missionAssignments.id,
      missionId: missions.id,
      level: missions.level,
      prompt: missions.prompt,
      expectedMinutes: missions.expectedMinutes,
      response: missionAssignments.response,
      assignedForDate: missionAssignments.assignedForDate,
    })
    .from(missionAssignments)
    .innerJoin(missions, eq(missions.id, missionAssignments.missionId))
    .where(
      and(
        eq(missionAssignments.userId, userId),
        eq(missionAssignments.assignedForDate, date),
      ),
    )
    .orderBy(desc(missionAssignments.sentAt))
    .limit(1);
  return row ?? null;
}

/**
 * Compute today's date string in the user's timezone. Phase 1 will load
 * the user's timezone from the users table; until then we use the Seoul
 * default declared in the schema.
 */
function todayInUserTimezone(_userId: string): string {
  void _userId;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}
