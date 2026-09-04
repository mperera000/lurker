import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngest();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ingest failed", error);
    return NextResponse.json(
      { error: "Ingest failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
