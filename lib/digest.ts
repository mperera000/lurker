import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { competitors, digests, industries, rawPosts, signals } from "@/lib/db/schema";

export async function generateDigest(options?: {
  hours?: number;
  industrySlug?: string;
}) {
  const hours = options?.hours ?? 24;
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - hours * 3600_000);

  const industry = options?.industrySlug
    ? await db.query.industries.findFirst({
        where: eq(industries.slug, options.industrySlug),
      })
    : await db.query.industries.findFirst({
        orderBy: (table, { asc }) => [asc(table.createdAt)],
      });

  if (!industry) {
    throw new Error("No industry found. Run pnpm db:seed first.");
  }

  const settings = await db.query.appSettings.findFirst({
    where: (table, { eq: equals }) => equals(table.industryId, industry.id),
  });
  const threshold = settings?.scoreThreshold ?? 0.65;

  const rows = await db
    .select({
      signal: signals,
      post: rawPosts,
      competitor: competitors,
    })
    .from(signals)
    .innerJoin(rawPosts, eq(signals.rawPostId, rawPosts.id))
    .leftJoin(competitors, eq(rawPosts.competitorId, competitors.id))
    .where(
      and(
        gte(signals.createdAt, periodStart),
        gte(signals.score, threshold),
        inArray(signals.label, ["launch", "feature"]),
      ),
    )
    .orderBy(desc(signals.score), desc(signals.createdAt));

  const bodyMd = renderDigestMarkdown({
    industryName: industry.name,
    periodStart,
    periodEnd,
    threshold,
    rows: rows.map((row) => ({
      label: row.signal.label,
      score: row.signal.score,
      summary: row.signal.summary,
      rationale: row.signal.rationale,
      competitorName: row.competitor?.name ?? row.post.authorUsername,
      url: row.post.url,
      postedAt: row.post.postedAt,
    })),
  });

  const [digest] = await db
    .insert(digests)
    .values({
      industryId: industry.id,
      periodStart,
      periodEnd,
      bodyMd,
    })
    .returning();

  return digest;
}

function renderDigestMarkdown(input: {
  industryName: string;
  periodStart: Date;
  periodEnd: Date;
  threshold: number;
  rows: Array<{
    label: string;
    score: number;
    summary: string;
    rationale: string;
    competitorName: string;
    url: string;
    postedAt: Date;
  }>;
}): string {
  const launches = input.rows.filter((row) => row.label === "launch");
  const features = input.rows.filter((row) => row.label === "feature");
  const lines = [
    `# ${input.industryName} launch digest`,
    "",
    `Period: ${input.periodStart.toISOString()} → ${input.periodEnd.toISOString()}`,
    `Threshold: ${input.threshold.toFixed(2)} · ${input.rows.length} high-score signal(s)`,
    "",
    `## Launches (${launches.length})`,
    "",
  ];

  if (launches.length === 0) {
    lines.push("_No launch-class signals in this window._", "");
  } else {
    for (const row of launches) {
      lines.push(formatItem(row), "");
    }
  }

  lines.push(`## Features (${features.length})`, "");
  if (features.length === 0) {
    lines.push("_No feature-class signals in this window._", "");
  } else {
    for (const row of features) {
      lines.push(formatItem(row), "");
    }
  }

  return lines.join("\n").trim() + "\n";
}

function formatItem(row: {
  competitorName: string;
  score: number;
  summary: string;
  url: string;
  rationale: string;
  postedAt: Date;
}): string {
  return [
    `### ${row.competitorName} · ${row.score.toFixed(2)}`,
    "",
    row.summary,
    "",
    `- Posted: ${row.postedAt.toISOString()}`,
    `- [Open on X](${row.url})`,
    `- Rationale: ${row.rationale}`,
  ].join("\n");
}
