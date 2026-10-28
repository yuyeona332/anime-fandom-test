export type MissionLevel =
  | "L1_cognitive"
  | "L2_home_action"
  | "L3_outside_action"
  | "L4_social_action";

export interface MissionTemplate {
  /** Stable id used for seeding the DB. Do not change once seeded. */
  id: string;
  level: MissionLevel;
  /** Short category tag, e.g. "window", "walk", "cafe". */
  category: string;
  /** Korean copy shown to user. */
  prompt: string;
  /** Suggested duration in minutes. Always small (<=15) by design. */
  expectedMinutes: number;
}

export const levelLabel: Record<MissionLevel, string> = {
  L1_cognitive: "인지",
  L2_home_action: "집안 행동",
  L3_outside_action: "집 밖 행동",
  L4_social_action: "사회적 행동",
};
