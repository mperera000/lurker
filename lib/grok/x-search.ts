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

export function extractGrokText(body: ResponsesPayload): string {
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

export async function grokXSearch(
  input: string,
  tool: Record<string, unknown> = { type: "x_search" },
): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error("missing_xai_key");
  }

  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [{ role: "user", content: input }],
      tools: [tool],
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    console.error("Grok X Search failed", {
      status: response.status,
      body: raw.slice(0, 400),
    });
    throw new Error("grok_failed");
  }

  return extractGrokText(JSON.parse(raw) as ResponsesPayload);
}
