/**
 * Korean risk-keyword dictionary for client-side fast-path detection.
 *
 * Scope and limits:
 *   - This is the FIRST layer only. The server-side LLM judgment (Claude
 *     haiku, low-temp) is the authoritative classifier. Keyword matches
 *     here short-circuit to the resource modal before any server call,
 *     so a false positive here is preferable to a false negative.
 *   - Dictionary is intentionally narrow. Broadening it without clinical
 *     review increases false-positive fatigue, which trains users to
 *     dismiss the resource modal.
 *   - Categories map onto crisis-resources/catalog.ts categories.
 *
 * Phase 0 dependency:
 *   - Korean idioms for suicide ideation vary by region and generation.
 *     Confirm the L1 entries below against the clinical advisor's
 *     reference list before adding any new term.
 *
 * NEVER log the matched user utterance. Log the matched CATEGORY id only
 * (see risk_events.matched_keywords schema field).
 */

export type RiskCategory =
  | "suicide"
  | "self_harm"
  | "domestic_violence"
  | "abuse_general";

export interface RiskKeyword {
  /** Stable id for analytics (matched_keywords stores these, not user text). */
  id: string;
  category: RiskCategory;
  /** Exact phrases or short substrings. Case-insensitive match. */
  patterns: ReadonlyArray<string>;
}

/**
 * High-confidence triggers — match short-circuits to the active modal.
 * Each entry should be a phrase a user would only utter when actually
 * referencing the category. Vague distress goes to the LLM layer.
 */
export const riskKeywords: ReadonlyArray<RiskKeyword> = [
  {
    id: "suicide-direct-1",
    category: "suicide",
    patterns: ["죽고싶", "죽고 싶", "자살하고싶", "자살하고 싶"],
  },
  {
    id: "suicide-method-allusion",
    category: "suicide",
    patterns: ["뛰어내리", "목을 매", "약을 다", "유서"],
  },
  {
    id: "self-harm-direct",
    category: "self_harm",
    patterns: ["자해", "긋고싶", "긋고 싶", "내 몸을 다치"],
  },
  {
    id: "dv-physical",
    category: "domestic_violence",
    patterns: ["맞았어", "맞고있", "맞고 있", "때려", "폭행"],
  },
  {
    id: "dv-control",
    category: "domestic_violence",
    patterns: ["나가지 못하게", "감금", "협박당"],
  },
  {
    id: "abuse-general",
    category: "abuse_general",
    patterns: ["성폭행", "강제로", "성희롱"],
  },
];

export interface KeywordMatch {
  id: string;
  category: RiskCategory;
}

/**
 * Scan an input string for any high-confidence pattern. Returns matched
 * categories (deduped) without including the raw user text. Callers must
 * never persist the original input to standard storage when this returns
 * a non-empty result — route to the isolated encrypted store instead.
 */
export function scanForRisk(input: string): ReadonlyArray<KeywordMatch> {
  const normalized = input.normalize("NFC").toLowerCase();
  const matches = new Map<string, KeywordMatch>();

  for (const keyword of riskKeywords) {
    const hit = keyword.patterns.some((pattern) =>
      normalized.includes(pattern.toLowerCase()),
    );
    if (hit && !matches.has(keyword.id)) {
      matches.set(keyword.id, { id: keyword.id, category: keyword.category });
    }
  }

  return Array.from(matches.values());
}
