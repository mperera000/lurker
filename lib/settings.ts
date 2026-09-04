import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings, industries } from "@/lib/db/schema";

const DEFAULT_CRON_NOTES = `Ingest runs every 30 minutes via Vercel Cron → POST /api/cron/ingest.
Quiet hours are stored but not enforced in v1.`;

export async function getAppSettings() {
  const existing = await db.query.appSettings.findFirst({
    with: { industry: true },
  });
  if (existing) return existing;

  const industry = await db.query.industries.findFirst({
    orderBy: (table, { asc }) => [asc(table.createdAt)],
  });
  if (!industry) return null;

  const [created] = await db
    .insert(appSettings)
    .values({
      industryId: industry.id,
      scoreThreshold: 0.65,
      cronNotes: DEFAULT_CRON_NOTES,
    })
    .returning();

  return created
    ? {
        ...created,
        industry,
      }
    : null;
}

export async function updateAppSettings(input: {
  industryName?: string;
  scoreThreshold?: number;
  cronNotes?: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}) {
  const current = await getAppSettings();
  if (!current) {
    throw new Error("No settings row. Run pnpm db:seed first.");
  }

  if (input.industryName && input.industryName.trim()) {
    await db
      .update(industries)
      .set({ name: input.industryName.trim() })
      .where(eq(industries.id, current.industryId));
  }

  const [updated] = await db
    .update(appSettings)
    .set({
      scoreThreshold:
        input.scoreThreshold !== undefined
          ? input.scoreThreshold
          : current.scoreThreshold,
      cronNotes:
        input.cronNotes !== undefined ? input.cronNotes : current.cronNotes,
      quietHoursStart:
        input.quietHoursStart !== undefined
          ? input.quietHoursStart
          : current.quietHoursStart,
      quietHoursEnd:
        input.quietHoursEnd !== undefined
          ? input.quietHoursEnd
          : current.quietHoursEnd,
      updatedAt: new Date(),
    })
    .where(eq(appSettings.id, current.id))
    .returning();

  return getAppSettings() ?? updated;
}
