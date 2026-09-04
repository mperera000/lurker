import type { Competitor } from "@/lib/db/schema";
import { XClient, type XTweet } from "./client";

export async function fetchCompetitorPosts(
  client: XClient,
  competitor: Competitor,
  maxResults = 10,
): Promise<{ tweets: XTweet[]; xUserId: string | null }> {
  let userId = competitor.xUserId;
  if (!userId) {
    const user = await client.getUserByUsername(competitor.xUsername);
    userId = user?.id ?? null;
  }
  if (!userId) {
    return { tweets: [], xUserId: null };
  }
  const tweets = await client.getUserTweets(
    userId,
    competitor.xUsername,
    maxResults,
  );
  return { tweets, xUserId: userId };
}

export function buildKeywordSearchQuery(
  phrases: string[],
  usernames: string[],
): string {
  const positive = phrases
    .filter((phrase) => phrase.trim().length > 0)
    .slice(0, 8)
    .map((phrase) => `"${phrase.replace(/"/g, "")}"`);
  const fromClause = usernames
    .slice(0, 10)
    .map((username) => `from:${username.replace(/^@/, "")}`);

  const parts: string[] = [];
  if (positive.length > 0) parts.push(`(${positive.join(" OR ")})`);
  if (fromClause.length > 0) parts.push(`(${fromClause.join(" OR ")})`);
  parts.push("-is:retweet");
  return parts.join(" ");
}
