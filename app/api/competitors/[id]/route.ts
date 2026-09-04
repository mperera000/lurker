import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/api";
import { db } from "@/lib/db";
import { competitors } from "@/lib/db/schema";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    xUsername?: string;
    active?: boolean;
    industry?: string;
  } | null;

  const patch: Partial<typeof competitors.$inferInsert> = {};
  if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body?.xUsername === "string" && body.xUsername.trim()) {
    patch.xUsername = body.xUsername.replace(/^@/, "").trim();
  }
  if (typeof body?.active === "boolean") patch.active = body.active;

  if (Object.keys(patch).length === 0) {
    return jsonError("No valid fields to update");
  }

  try {
    const [item] = await db
      .update(competitors)
      .set(patch)
      .where(eq(competitors.id, id))
      .returning();
    if (!item) return jsonError("Competitor not found", 404);
    return NextResponse.json({ item });
  } catch {
    return jsonError("Could not update competitor", 409);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await context.params;
  const [item] = await db
    .delete(competitors)
    .where(eq(competitors.id, id))
    .returning();
  if (!item) return jsonError("Competitor not found", 404);
  return NextResponse.json({ ok: true });
}
