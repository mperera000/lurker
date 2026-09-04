import { NextResponse } from "next/server";
import { updateAlertStatus, type AlertStatus } from "@/lib/alerts";
import { jsonError, requireSession } from "@/lib/api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { status?: string }
    | null;
  const status = body?.status;
  if (status !== "new" && status !== "seen" && status !== "dismissed") {
    return jsonError("status must be new, seen, or dismissed");
  }

  const updated = await updateAlertStatus(id, status as AlertStatus);
  if (!updated) return jsonError("Alert not found", 404);
  return NextResponse.json({ item: updated });
}
