import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { missionLogs, missions } from "@/lib/db/schema";
import type { MissionLevel } from "./types";

export interface HistoryEntry {
  logId: string;
  level: MissionLevel;
  prompt: string;
  completedAt: Date;
  status: "completed" | "skipped";
  note: string | null;
  photoUrl: string | null;
}

/**
 * Recent mission logs for a user, newest first. Capped at 30 entries —
 * the history view is for orientation, not analytics. Phase 3 may add a
 * calendar view that paginates further.
 */
export async function getRecentHistory(
  userId: string,
  limit = 30,
): Promise<ReadonlyArray<HistoryEntry>> {
  const db = await getDb();
  const rows = await db
    .select({
      logId: missionLogs.id,
      level: missions.level,
      prompt: missions.prompt,
      completedAt: missionLogs.completedAt,
      status: missionLogs.status,
      note: missionLogs.note,
      photoUrl: missionLogs.photoUrl,
    })
    .from(missionLogs)
    .innerJoin(missions, eq(missions.id, missionLogs.missionId))
    .where(eq(missionLogs.userId, userId))
    .orderBy(desc(missionLogs.completedAt))
    .limit(limit);

  return rows;
}
