import { grokXSearch } from "@/lib/grok/x-search";

export type SuggestedCompetitor = {
  name: string;
  xUsername: string;
};

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const TOP = 5;
const cache = new Map<string, SuggestedCompetitor[]>();

export function parseSuggestedCompetitors(text: string): SuggestedCompetitor[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const accounts: SuggestedCompetitor[] = [];

  for (const row of parsed) {
    if (!row || typeof row !== "object") continue;
    const record = row as { name?: unknown; xUsername?: unknown };
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const xUsername =
      typeof record.xUsername === "string"
        ? record.xUsername.replace(/^@/, "").trim()
        : "";
    if (!name || !HANDLE.test(xUsername)) continue;
    const key = xUsername.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    accounts.push({ name, xUsername });
    if (accounts.length === TOP) break;
  }

  return accounts;
}

export async function suggestCompanies(
  industry: string,
): Promise<SuggestedCompetitor[]> {
  const cached = cache.get(industry.toLowerCase());
  if (cached) {
    console.log("Suggested competitors from cache", {
      industry,
      count: cached.length,
    });
    return cached;
  }

  const text = await grokXSearch(
    `Name the 5 most prominent companies in the "${industry}" industry that have an official X account and are active there. Return JSON only: [{"name":"","xUsername":""}]. xUsername must be the exact current X username without @. Do not invent handles. If you are not sure a handle exists, omit that company.`,
  );
  const accounts = parseSuggestedCompetitors(text);
  if (accounts.length === 0) {
    console.error("Suggested competitors empty", {
      industry,
      preview: text.slice(0, 400),
    });
    throw new Error("no_companies");
  }

  cache.set(industry.toLowerCase(), accounts);
  console.log("Suggested competitors", { industry, count: accounts.length });
  return accounts;
}
