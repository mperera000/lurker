import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/api";
import { db } from "@/lib/db";
import { competitors, industries } from "@/lib/db/schema";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  const items = await db
    .select({
      id: competitors.id,
      name: competitors.name,
      xUsername: competitors.xUsername,
      xUserId: competitors.xUserId,
      active: competitors.active,
      industryId: competitors.industryId,
      industryName: industries.name,
      createdAt: competitors.createdAt,
    })
    .from(competitors)
    .innerJoin(industries, eq(competitors.industryId, industries.id))
    .orderBy(desc(competitors.createdAt));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    xUsername?: string;
    industry?: string;
    active?: boolean;
  } | null;

  const name = body?.name?.trim();
  const xUsername = body?.xUsername?.replace(/^@/, "").trim();
  if (!name || !xUsername) {
    return jsonError("name and xUsername are required");
  }

  const settings = await getAppSettings();
  if (!settings) return jsonError("Seed an industry first (pnpm db:seed)", 409);

  try {
    const [item] = await db
      .insert(competitors)
      .values({
        industryId: settings.industryId,
        name,
        xUsername,
        active: body?.active ?? true,
      })
      .returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("Could not create competitor (username may already exist)", 409);
  }
}
