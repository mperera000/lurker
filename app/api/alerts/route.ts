import { NextResponse } from "next/server";
import { listAlerts, type AlertStatus } from "@/lib/alerts";
import { jsonError, requireSession } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  const status = new URL(request.url).searchParams.get("status") ?? "new";
  const allowed = new Set(["new", "seen", "dismissed", "all"]);
  if (!allowed.has(status)) {
    return jsonError("status must be new, seen, dismissed, or all");
  }

  const items = await listAlerts(status as AlertStatus | "all");
  return NextResponse.json({ items });
}
