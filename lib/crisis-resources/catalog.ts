/**
 * Korean crisis hotline catalog.
 *
 * IMPORTANT before launch: verify each entry's operating hours and service
 * scope against the operator's current public listing. Hotlines change
 * service models; out-of-date numbers can route a user in crisis to a
 * disconnected line.
 *
 * Last verified: (none — placeholder, verify before any non-internal use)
 */

export interface CrisisResource {
  /** Stable id used by the UI to choose styling and ordering. */
  id: string;
  /** Display label in Korean. */
  label: string;
  /** Short, plain-language description of what this line handles. */
  description: string;
  /** Phone number for tel: link. Use the dialable form, no formatting. */
  phone?: string;
  /** Optional web/chat URL (e.g. KakaoTalk channel). */
  url?: string;
  /** Operating hours in Korean for UI display. */
  hours: string;
  /** Free-text categories used to select resources for a given risk type. */
  categories: ReadonlyArray<
    "suicide" | "mental_health" | "domestic_violence" | "youth" | "general"
  >;
  /** Whether this resource is appropriate for under-19 users. */
  youthSafe: boolean;
}

export const crisisResources: ReadonlyArray<CrisisResource> = [
  {
    id: "kr-1393",
    label: "자살예방상담전화 1393",
    description: "자살 위기 상담. 24시간 전화 상담 가능.",
    phone: "1393",
    hours: "24시간",
    categories: ["suicide", "mental_health"],
    youthSafe: true,
  },
  {
    id: "kr-1577-0199",
    label: "정신건강위기상담 1577-0199",
    description: "정신건강 위기 상담. 24시간 전화 상담 가능.",
    phone: "1577-0199",
    hours: "24시간",
    categories: ["mental_health", "suicide"],
    youthSafe: true,
  },
  {
    id: "kr-1366",
    label: "여성긴급전화 1366",
    description: "가정폭력, 성폭력, 데이트폭력 등 위기 상담. 24시간.",
    phone: "1366",
    hours: "24시간",
    categories: ["domestic_violence", "general"],
    youthSafe: true,
  },
  {
    id: "kr-1388",
    label: "청소년상담전화 1388",
    description: "만 24세 이하 청소년·청년 대상 상담.",
    phone: "1388",
    hours: "24시간",
    categories: ["youth", "mental_health", "general"],
    youthSafe: true,
  },
  {
    id: "kr-kakao-suicide",
    label: "카카오톡 자살예방상담",
    description: "카카오톡 채팅 기반 상담. 전화가 어려운 경우 권장.",
    url: "https://pf.kakao.com/_jBxinxj",
    hours: "운영시간 확인 필요",
    categories: ["suicide", "mental_health"],
    youthSafe: true,
  },
];

export function resourcesFor(
  categories: ReadonlyArray<CrisisResource["categories"][number]>,
  options?: { youthOnly?: boolean },
): ReadonlyArray<CrisisResource> {
  return crisisResources.filter((resource) => {
    if (options?.youthOnly && !resource.youthSafe) {
      return false;
    }
    return resource.categories.some((category) =>
      categories.includes(category),
    );
  });
}
