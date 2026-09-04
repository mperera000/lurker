import { eq } from "drizzle-orm";
import { classifyPost } from "@/lib/classifyPost";
import { db } from "@/lib/db";
import {
  alerts,
  competitors,
  rawPosts,
  signals,
  watchKeywords,
  type Competitor,
} from "@/lib/db/schema";
import { getAppSettings } from "@/lib/settings";
import { XClient } from "@/lib/x/client";
import {
  buildKeywordSearchQuery,
  fetchCompetitorPosts,
} from "@/lib/x/fetchCompetitorPosts";
import type { XTweet } from "@/lib/x/client";

export type IngestResult = {
  mode: "live" | "mock";
  ingested: number;
  fetched: number;
  new_posts: number;
  new_signals: number;
  new_alerts: number;
};

export async function runIngest(): Promise<IngestResult> {
  const client = XClient.fromEnv();
  if (!client) {
    return {
      mode: "mock",
      ingested: 0,
      fetched: 0,
      new_posts: 0,
      new_signals: 0,
      new_alerts: 0,
    };
  }

  const settings = await getAppSettings();
  const activeCompetitors = await db.query.competitors.findMany({
    where: eq(competitors.active, true),
  });
  const keywords = settings
    ? await db.query.watchKeywords.findMany({
        where: eq(watchKeywords.industryId, settings.industryId),
      })
    : [];
  const threshold = settings?.scoreThreshold ?? 0.65;

  const seen = new Map<string, XTweet>();
  const tweetCompetitor = new Map<string, Competitor | null>();

  for (const competitor of activeCompetitors) {
    try {
      const { tweets, xUserId } = await fetchCompetitorPosts(client, competitor);
      if (xUserId && xUserId !== competitor.xUserId) {
        await db
          .update(competitors)
          .set({ xUserId })
          .where(eq(competitors.id, competitor.id));
      }
      for (const tweet of tweets) {
        seen.set(tweet.id, tweet);
        tweetCompetitor.set(tweet.id, competitor);
      }
    } catch (error) {
      console.error(`Failed to fetch @${competitor.xUsername}`, error);
    }
  }

  const positivePhrases = keywords
    .filter((keyword) => keyword.weight > 0)
    .map((keyword) => keyword.phrase);
  if (positivePhrases.length > 0 && activeCompetitors.length > 0) {
    try {
      const query = buildKeywordSearchQuery(
        positivePhrases,
        activeCompetitors.map((row) => row.xUsername),
      );
      const searchTweets = await client.searchRecent(query, 20);
      const byUsername = new Map(
        activeCompetitors.map((row) => [row.xUsername.toLowerCase(), row]),
      );
      for (const tweet of searchTweets) {
        if (!seen.has(tweet.id)) {
          seen.set(tweet.id, tweet);
          tweetCompetitor.set(
            tweet.id,
            byUsername.get(tweet.authorUsername.toLowerCase()) ?? null,
          );
        }
      }
    } catch (error) {
      console.error("Keyword search failed", error);
    }
  }

  let newPosts = 0;
  let newSignals = 0;
  let newAlerts = 0;

  for (const tweet of seen.values()) {
    const competitor = tweetCompetitor.get(tweet.id) ?? null;
    const existing = await db.query.rawPosts.findFirst({
      where: eq(rawPosts.xPostId, tweet.id),
    });

    const [post] = await db
      .insert(rawPosts)
      .values({
        xPostId: tweet.id,
        competitorId: competitor?.id ?? null,
        text: tweet.text,
        url: tweet.url,
        authorUsername: tweet.authorUsername,
        postedAt: new Date(tweet.createdAt),
        rawJson: tweet.raw,
      })
      .onConflictDoUpdate({
        target: rawPosts.xPostId,
        set: {
          text: tweet.text,
          url: tweet.url,
          competitorId: competitor?.id ?? existing?.competitorId ?? null,
          rawJson: tweet.raw,
        },
      })
      .returning();

    if (!post) continue;
    if (!existing) newPosts += 1;

    const classification = classifyPost(
      { text: tweet.text, authorUsername: tweet.authorUsername },
      competitor
        ? { name: competitor.name, xUsername: competitor.xUsername }
        : null,
      keywords,
      threshold,
    );

    const existingSignal = await db.query.signals.findFirst({
      where: eq(signals.rawPostId, post.id),
    });

    const [signal] = await db
      .insert(signals)
      .values({
        rawPostId: post.id,
        score: classification.score,
        label: classification.label,
        summary: classification.summary,
        rationale: classification.rationale,
      })
      .onConflictDoUpdate({
        target: signals.rawPostId,
        set: {
          score: classification.score,
          label: classification.label,
          summary: classification.summary,
          rationale: classification.rationale,
        },
      })
      .returning();

    if (signal && !existingSignal) newSignals += 1;
    if (!signal) continue;

    const shouldAlert =
      classification.score >= threshold &&
      (classification.label === "launch" || classification.label === "feature");

    if (shouldAlert) {
      const existingAlert = await db.query.alerts.findFirst({
        where: eq(alerts.signalId, signal.id),
      });
      await db
        .insert(alerts)
        .values({ signalId: signal.id, status: "new" })
        .onConflictDoNothing();
      if (!existingAlert) newAlerts += 1;
    }
  }

  return {
    mode: "live",
    ingested: newPosts,
    fetched: seen.size,
    new_posts: newPosts,
    new_signals: newSignals,
    new_alerts: newAlerts,
  };
}
