/**
 * Phase 0: prove Grok X Search can see real posts and handles.
 * Needs XAI_API_KEY in .env.local. Does not change the app.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const API = "https://api.x.ai/v1/responses";
const MODEL = "grok-4-fast";

type ResponsesPayload = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
    text?: string;
  }>;
  citations?: Array<{ url?: string }>;
  output_text?: string;
};

function requireKey(): string {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error(
      "XAI_API_KEY is missing. Get one at https://x.ai/api and add it to .env.local.",
    );
  }
  return key;
}

function extractText(body: ResponsesPayload): string {
  if (typeof body.output_text === "string" && body.output_text.trim()) {
    return body.output_text;
  }
  const chunks: string[] = [];
  for (const item of body.output ?? []) {
    if (typeof item.text === "string") chunks.push(item.text);
    for (const part of item.content ?? []) {
      if (typeof part.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

function extractUrls(text: string, citations: Array<{ url?: string }>): string[] {
  const found = new Set<string>();
  for (const c of citations) {
    if (c.url) found.add(c.url);
  }
  const re = /https?:\/\/(?:x|twitter)\.com\/[^\s)\]'"]+/gi;
  for (const match of text.match(re) ?? []) found.add(match);
  return [...found];
}

async function grokXSearch(input: string, tool: Record<string, unknown>) {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [{ role: "user", content: input }],
      tools: [tool],
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`xAI ${response.status}: ${raw.slice(0, 800)}`);
  }
  return JSON.parse(raw) as ResponsesPayload;
}

async function main() {
  console.log("Phase 0 — Grok X Search\n");

  console.log("Test A: known Voice AI handles (elevenlabsio, OpenAI)");
  const known = await grokXSearch(
    "Search X for recent posts from @elevenlabsio and @OpenAI that could be a product launch or new model. List up to 3. For each, give the @handle, one-line summary, and the exact x.com URL. If you cannot find a real URL, say so.",
    {
      type: "x_search",
      allowed_x_handles: ["elevenlabsio", "OpenAI"],
    },
  );
  const knownText = extractText(known);
  const knownUrls = extractUrls(knownText, known.citations ?? []);
  console.log(knownText.slice(0, 2000));
  console.log("URLs:", knownUrls.length ? knownUrls : "(none)");

  console.log("\nTest B: industry we did not seed (EV charging) — suggest companies + handles");
  const unknown = await grokXSearch(
    'Name 5 EV charging companies that are active on X. Return JSON only: [{"name":"","xUsername":""}]. Usernames must be real handles without @.',
    { type: "x_search" },
  );
  const unknownText = extractText(unknown);
  console.log(unknownText.slice(0, 2000));

  const knownPass = knownUrls.some((url) =>
    /x\.com|twitter\.com/i.test(url),
  );
  const handleMatches = unknownText.match(/"xUsername"\s*:\s*"([A-Za-z0-9_]+)"/g) ?? [];
  const unknownPass = handleMatches.length >= 3;

  console.log("\n--- Result ---");
  console.log(
    knownPass
      ? "PASS A: at least one real X URL for a known handle."
      : "FAIL A: no x.com URL. Do not build login on this pipe yet.",
  );
  console.log(
    unknownPass
      ? `PASS B: ${handleMatches.length} suggested handles. Spot-check they open on X before trusting them.`
      : "FAIL B: not enough suggested handles. Discover-unknown-companies is shaky.",
  );

  if (!knownPass) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
