export type SignalLabel = "launch" | "feature" | "noise";

export type ClassifiablePost = {
  text: string;
  authorUsername?: string | null;
};

export type WatchedCompetitor = {
  name: string;
  xUsername: string;
} | null;

export type WatchKeyword = {
  phrase: string;
  weight: number;
};

export type Classification = {
  score: number;
  label: SignalLabel;
  summary: string;
  rationale: string;
};

export const DEFAULT_SCORE_THRESHOLD = 0.65;
export const LAUNCH_SCORE_THRESHOLD = 0.75;
export const COMPETITOR_BONUS = 0.35;
export const KEYWORD_MATCH_COEFFICIENT = 0.15;
export const KEYWORD_BONUS_CAP = 0.45;
export const LINK_BONUS = 0.15;
export const PRODUCT_NOUN_BONUS = 0.1;

export const PRODUCT_NOUNS = [
  "model",
  "api",
  "sdk",
  "agent",
  "voice",
  "realtime",
] as const;

const LINK_RE = /https?:\/\//i;

/** Reserved for v2. Heuristic classifier is used in v1. */
export async function classifyPostLlm(
  _post: ClassifiablePost,
): Promise<Classification | null> {
  return null;
}

export function classifyPost(
  post: ClassifiablePost,
  competitor: WatchedCompetitor,
  keywords: WatchKeyword[],
  threshold: number = DEFAULT_SCORE_THRESHOLD,
): Classification {
  let score = 0;
  const rules: string[] = [];
  const text = post.text ?? "";

  if (competitor) {
    score += COMPETITOR_BONUS;
    rules.push(`watched competitor +${COMPETITOR_BONUS}`);
  }

  let keywordBonus = 0;
  const matchedPositive: string[] = [];
  const matchedNegative: string[] = [];

  for (const keyword of keywords) {
    if (!phraseMatches(text, keyword.phrase)) continue;
    if (keyword.weight >= 0) {
      keywordBonus += KEYWORD_MATCH_COEFFICIENT * keyword.weight;
      matchedPositive.push(keyword.phrase);
    } else {
      score += keyword.weight;
      matchedNegative.push(`${keyword.phrase} (${keyword.weight})`);
    }
  }

  const cappedKeywordBonus = Math.min(keywordBonus, KEYWORD_BONUS_CAP);
  if (cappedKeywordBonus > 0) {
    score += cappedKeywordBonus;
    rules.push(
      `keywords [${matchedPositive.join(", ")}] +${cappedKeywordBonus.toFixed(2)}`,
    );
  }
  if (matchedNegative.length > 0) {
    rules.push(`downrank ${matchedNegative.join(", ")}`);
  }

  if (LINK_RE.test(text)) {
    score += LINK_BONUS;
    rules.push(`contains link +${LINK_BONUS}`);
  }

  const matchedNouns = PRODUCT_NOUNS.filter((noun) => phraseMatches(text, noun));
  if (matchedNouns.length > 0) {
    score += PRODUCT_NOUN_BONUS;
    rules.push(
      `product nouns [${matchedNouns.join(", ")}] +${PRODUCT_NOUN_BONUS}`,
    );
  }

  score = clamp(score, 0, 1);

  let label: SignalLabel;
  if (score >= LAUNCH_SCORE_THRESHOLD) {
    label = "launch";
  } else if (score >= threshold) {
    label = "feature";
  } else {
    label = "noise";
  }

  return {
    score: round4(score),
    label,
    summary: summarize(text),
    rationale: rules.length > 0 ? rules.join("; ") : "no matching rules",
  };
}

export function phraseMatches(text: string, phrase: string): boolean {
  if (!phrase.trim()) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
  return re.test(text);
}

export function summarize(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  if (sentence.length <= 160) return sentence;
  return `${sentence.slice(0, 157).trimEnd()}...`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
