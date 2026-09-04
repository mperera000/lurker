import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/api";
import { generateDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as {
    hours?: number;
  };

  try {
    const digest = await generateDigest({ hours: body.hours ?? 24 });
    return NextResponse.json({ item: digest }, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not generate digest",
      500,
    );
  }
}
