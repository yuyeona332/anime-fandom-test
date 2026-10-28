/**
 * Server-side risk classification.
 *
 * Layer order (PLAN.md §Safety Architecture):
 *   1. Client keyword scan (lib/safety/keywords.ts) — short-circuits to
 *      modal BEFORE calling this module. If the client matched, we already
 *      showed the modal; this layer still logs the event.
 *   2. This module — LLM judgment with low temperature. Authoritative
 *      classifier for the 0-10 severity score.
 *
 * Privacy rules:
 *   - The original user utterance must be persisted only to the isolated
 *     storage backend, never to standard tables.
 *   - The LLM judgment we return contains a rationale summary, not the
 *     raw utterance. Callers must enforce that separation.
 *
 * Model selection:
 *   - Judgment: Claude haiku 4.5 (low temp) — cheap, fast, good enough.
 *   - Escalation response generation (severity >= 4): caller switches to
 *     opus 4.7 with the "옆사람 모드" prompt. That logic lives elsewhere;
 *     this module only classifies.
 */

import { scanForRisk, type RiskCategory } from "./keywords";

export interface RiskJudgment {
  severity: number; // 0-10
  primaryCategory: RiskCategory | "general_distress" | "normal";
  rationaleSummary: string; // short, no verbatim user text
  recommendedAction:
    | "modal_shown" // severity >= 7, hard intervention
    | "soft_check_in" // 4-6
    | "none"; // <= 3
  // Categories of resource catalog entries to surface when action is modal_shown.
  resourceCategories: ReadonlyArray<
    "suicide" | "mental_health" | "domestic_violence" | "youth" | "general"
  >;
}

export interface RiskClassifierInput {
  utterance: string;
  /** Source channel — used in logging, not in classification logic. */
  source: "chat" | "mission_note" | "manual";
}

/**
 * Classify an utterance for safety routing. Pure logic + LLM call.
 * Does not write to DB and does not surface UI — that is the caller's job.
 */
export async function classifyUtterance(
  input: RiskClassifierInput,
): Promise<RiskJudgment> {
  // Layer 1: keyword scan still runs server-side as a safety net even if
  // the client already short-circuited. If keywords match, we know the
  // severity is >=7 by policy and skip the LLM call.
  const keywordMatches = scanForRisk(input.utterance);
  if (keywordMatches.length > 0) {
    const primaryCategory = keywordMatches[0].category;
    return {
      severity: 9,
      primaryCategory,
      rationaleSummary: `Keyword match (${keywordMatches.map((m) => m.id).join(", ")})`,
      recommendedAction: "modal_shown",
      resourceCategories: mapCategoryToResources(primaryCategory),
    };
  }

  // Layer 2: LLM judgment. The actual model call is stubbed until env
  // vars are wired in Phase 1; see PLAN.md §Tech Stack.
  return await llmJudge(input);
}

function mapCategoryToResources(
  category: RiskCategory,
): RiskJudgment["resourceCategories"] {
  switch (category) {
    case "suicide":
      return ["suicide", "mental_health"];
    case "self_harm":
      return ["mental_health", "suicide"];
    case "domestic_violence":
      return ["domestic_violence", "general"];
    case "abuse_general":
      return ["domestic_violence", "general"];
  }
}

/**
 * LLM-backed classification. Placeholder implementation — until the AI
 * Gateway key is provisioned this returns "normal" with severity 0.
 *
 * Phase 1 wiring contract:
 *   - Call AI Gateway with provider/model string "anthropic/claude-haiku-4-5"
 *   - Use a low-temperature structured prompt (Zod-validated JSON output)
 *   - Never include user PII or prior turns beyond what is strictly needed
 *   - Set { providerOptions: { anthropic: { zeroDataRetention: true } } }
 */
async function llmJudge(input: RiskClassifierInput): Promise<RiskJudgment> {
  return {
    severity: 0,
    primaryCategory: "normal",
    rationaleSummary: `LLM classifier not yet wired (Phase 1); source=${input.source}`,
    recommendedAction: "none",
    resourceCategories: [],
  };
}
