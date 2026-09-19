import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { suggestCompanies } from "@/lib/grok/suggest-companies";
import { findUsIndustry } from "@/lib/us-industries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    industry?: string;
  } | null;
  const industry = findUsIndustry(body?.industry ?? "");
  if (!industry) {
    return jsonError("Pick an industry from the list.");
  }

  try {
    const accounts = await suggestCompanies(industry);
    return NextResponse.json({ industry, accounts });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    if (code === "missing_xai_key") {
      return jsonError(
        "Company lookup is not set up yet. Add the xAI key and try again.",
        503,
      );
    }
    console.error("Industry suggest failed", { industry, code });
    return jsonError(
      "Could not find companies in that industry. Try again or pick another industry.",
      502,
    );
  }
}
