import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts, competitors, rawPosts, signals } from "@/lib/db/schema";

export type AlertStatus = "new" | "seen" | "dismissed";

export type AlertCard = {
  id: string;
  status: AlertStatus;
  createdAt: string;
  notifiedAt: string | null;
  score: number;
  label: "launch" | "feature" | "noise";
  summary: string;
  rationale: string;
  competitorName: string | null;
  authorUsername: string;
  url: string;
  postedAt: string;
};

export async function listAlerts(status?: AlertStatus | "all") {
  const rows = await db
    .select({
      alert: alerts,
      signal: signals,
      post: rawPosts,
      competitor: competitors,
    })
    .from(alerts)
    .innerJoin(signals, eq(alerts.signalId, signals.id))
    .innerJoin(rawPosts, eq(signals.rawPostId, rawPosts.id))
    .leftJoin(competitors, eq(rawPosts.competitorId, competitors.id))
    .where(
      status && status !== "all" ? eq(alerts.status, status) : undefined,
    )
    .orderBy(desc(rawPosts.postedAt), desc(alerts.createdAt));

  return rows.map(
    (row): AlertCard => ({
      id: row.alert.id,
      status: row.alert.status,
      createdAt: row.alert.createdAt.toISOString(),
      notifiedAt: row.alert.notifiedAt?.toISOString() ?? null,
      score: row.signal.score,
      label: row.signal.label,
      summary: row.signal.summary,
      rationale: row.signal.rationale,
      competitorName: row.competitor?.name ?? null,
      authorUsername: row.post.authorUsername,
      url: row.post.url,
      postedAt: row.post.postedAt.toISOString(),
    }),
  );
}

export async function updateAlertStatus(id: string, status: AlertStatus) {
  const [updated] = await db
    .update(alerts)
    .set({ status })
    .where(and(eq(alerts.id, id)))
    .returning();
  return updated ?? null;
}
