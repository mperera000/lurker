import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/api";
import { getAppSettings, updateAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  const settings = await getAppSettings();
  if (!settings) {
    return jsonError("No settings yet. Run pnpm db:seed.", 404);
  }
  return NextResponse.json({
    item: serialize(settings),
  });
}

export async function PATCH(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as {
    industryName?: string;
    scoreThreshold?: number;
    cronNotes?: string;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  } | null;

  if (body?.scoreThreshold !== undefined) {
    const value = Number(body.scoreThreshold);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      return jsonError("scoreThreshold must be between 0 and 1");
    }
  }

  try {
    const settings = await updateAppSettings({
      industryName: body?.industryName,
      scoreThreshold: body?.scoreThreshold,
      cronNotes: body?.cronNotes,
      quietHoursStart: body?.quietHoursStart,
      quietHoursEnd: body?.quietHoursEnd,
    });
    return NextResponse.json({ item: serialize(settings) });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not update settings",
      409,
    );
  }
}

function serialize(settings: Awaited<ReturnType<typeof getAppSettings>>) {
  if (!settings) return null;
  const industry =
    "industry" in settings && settings.industry
      ? settings.industry
      : null;
  return {
    id: settings.id,
    industryId: settings.industryId,
    industryName: industry?.name ?? null,
    industrySlug: industry?.slug ?? null,
    scoreThreshold: settings.scoreThreshold,
    cronNotes: settings.cronNotes,
    quietHoursStart: settings.quietHoursStart,
    quietHoursEnd: settings.quietHoursEnd,
    updatedAt: settings.updatedAt,
  };
}
