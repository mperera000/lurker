import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { classifyPost } from "../lib/classifyPost";
import {
  alerts,
  appSettings,
  competitors,
  industries,
  rawPosts,
  signals,
  watchKeywords,
} from "../lib/db/schema";

config({ path: ".env.local" });
config();

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to seed. See .env.example.");
  }
  return url;
}

const DEFAULT_CRON_NOTES = `Ingest runs every 30 minutes via Vercel Cron → POST /api/cron/ingest.
Local test:
curl -X POST http://localhost:3000/api/cron/ingest \\
  -H "Authorization: Bearer $CRON_SECRET"
Without X_BEARER_TOKEN the route returns { mode: "mock", ingested: 0 }.`;

const COMPETITORS = [
  { name: "ElevenLabs", xUsername: "elevenlabsio" },
  { name: "Hume", xUsername: "hume_ai" },
  { name: "Deepgram", xUsername: "DeepgramAI" },
  { name: "OpenAI", xUsername: "OpenAI" },
  { name: "Vapi", xUsername: "Vapi_AI" },
  { name: "Bland", xUsername: "bland_ai" },
  { name: "PlayHT", xUsername: "playht" },
  { name: "Cartesia", xUsername: "cartesia_ai" },
  { name: "Sesame", xUsername: "sesameai" },
  { name: "Retell", xUsername: "retellai" },
] as const;

const KEYWORDS: { phrase: string; weight: number }[] = [
  { phrase: "launch", weight: 1 },
  { phrase: "launched", weight: 1 },
  { phrase: "now available", weight: 1 },
  { phrase: "announcing", weight: 1 },
  { phrase: "shipping", weight: 1 },
  { phrase: "shipped", weight: 1 },
  { phrase: "generally available", weight: 1.2 },
  { phrase: "public beta", weight: 1 },
  { phrase: "releasing", weight: 1 },
  { phrase: "introducing", weight: 1 },
  { phrase: "new model", weight: 1 },
  { phrase: "v2", weight: 1 },
  { phrase: "v3", weight: 1 },
  { phrase: "we're hiring", weight: -0.8 },
  { phrase: "hiring", weight: -0.8 },
  { phrase: "podcast", weight: -0.8 },
  { phrase: "congrats", weight: -0.8 },
  { phrase: "meme", weight: -0.8 },
];

type MockPost = {
  xPostId: string;
  username: string;
  text: string;
  hoursAgo: number;
};

const MOCK_POSTS: MockPost[] = [
  {
    xPostId: "mock_el_v3",
    username: "elevenlabsio",
    text: "We launched Eleven v3 today — a new model for realtime conversational voice. Docs: https://elevenlabs.io/blog/v3",
    hoursAgo: 3,
  },
  {
    xPostId: "mock_hume_api",
    username: "hume_ai",
    text: "Announcing Octave 2, our empathic voice API. Now available for all workspaces. https://hume.ai/octave",
    hoursAgo: 6,
  },
  {
    xPostId: "mock_dg_nova",
    username: "DeepgramAI",
    text: "Shipping Flux realtime transcription improvements to the API this week. Changelog: https://deepgram.com/changelog",
    hoursAgo: 8,
  },
  {
    xPostId: "mock_oai_voice",
    username: "OpenAI",
    text: "Introducing a new speech-to-speech voice model in the API. https://openai.com/index/voice",
    hoursAgo: 12,
  },
  {
    xPostId: "mock_vapi_assist",
    username: "Vapi_AI",
    text: "Public beta for Assistants v2 is live. Build voice agents with the updated SDK. https://docs.vapi.ai",
    hoursAgo: 16,
  },
  {
    xPostId: "mock_cartesia_ga",
    username: "cartesia_ai",
    text: "Sonic is generally available. Lower-latency voice generation is now available on the API. https://cartesia.ai",
    hoursAgo: 20,
  },
  {
    xPostId: "mock_sesame_csm",
    username: "sesameai",
    text: "Releasing CSM-1B weights. Conversational voice demo: https://www.sesame.com",
    hoursAgo: 26,
  },
  {
    xPostId: "mock_retell_llm",
    username: "retellai",
    text: "We shipped a new model option for phone agents plus webhook retries. https://www.retellai.com/changelog",
    hoursAgo: 30,
  },
  {
    xPostId: "mock_bland_hire",
    username: "bland_ai",
    text: "We're hiring a founding voice engineer. Come build conversational agents with us.",
    hoursAgo: 10,
  },
  {
    xPostId: "mock_playht_meme",
    username: "playht",
    text: "This meme about cloned CEOs doing standup is too accurate.",
    hoursAgo: 14,
  },
  {
    xPostId: "mock_el_pod",
    username: "elevenlabsio",
    text: "Catch our founder on a podcast this Thursday talking about the future of voice.",
    hoursAgo: 18,
  },
  {
    xPostId: "mock_dg_congrats",
    username: "DeepgramAI",
    text: "Congrats to the teams shipping voice agents into production this quarter.",
    hoursAgo: 22,
  },
];

async function main() {
  const client = postgres(requireDatabaseUrl(), { max: 1 });
  const db = drizzle(client);

  console.log("Seeding Voice AI roster…");

  const [industry] = await db
    .insert(industries)
    .values({ slug: "voice-ai", name: "Voice AI" })
    .onConflictDoUpdate({
      target: industries.slug,
      set: { name: "Voice AI" },
    })
    .returning();

  if (!industry) throw new Error("Failed to upsert industry");

  await db
    .insert(appSettings)
    .values({
      industryId: industry.id,
      scoreThreshold: 0.65,
      cronNotes: DEFAULT_CRON_NOTES,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    })
    .onConflictDoNothing({ target: appSettings.industryId });

  const competitorRows = [];
  for (const row of COMPETITORS) {
    const [saved] = await db
      .insert(competitors)
      .values({
        industryId: industry.id,
        name: row.name,
        xUsername: row.xUsername,
        active: true,
      })
      .onConflictDoUpdate({
        target: competitors.xUsername,
        set: { name: row.name, industryId: industry.id, active: true },
      })
      .returning();
    if (saved) competitorRows.push(saved);
  }

  await db.delete(watchKeywords).where(eq(watchKeywords.industryId, industry.id));
  await db.insert(watchKeywords).values(
    KEYWORDS.map((keyword) => ({
      industryId: industry.id,
      phrase: keyword.phrase,
      weight: keyword.weight,
    })),
  );

  const byUsername = new Map(
    competitorRows.map((row) => [row.xUsername.toLowerCase(), row]),
  );
  const threshold = 0.65;

  let alertCount = 0;
  for (const mock of MOCK_POSTS) {
    const competitor = byUsername.get(mock.username.toLowerCase()) ?? null;
    const postedAt = new Date(Date.now() - mock.hoursAgo * 3600_000);
    const url = `https://x.com/${mock.username}/status/${mock.xPostId}`;
    const classification = classifyPost(
      { text: mock.text, authorUsername: mock.username },
      competitor
        ? { name: competitor.name, xUsername: competitor.xUsername }
        : null,
      KEYWORDS,
      threshold,
    );

    const [post] = await db
      .insert(rawPosts)
      .values({
        xPostId: mock.xPostId,
        competitorId: competitor?.id ?? null,
        text: mock.text,
        url,
        authorUsername: mock.username,
        postedAt,
        rawJson: { mock: true, source: "seed" },
      })
      .onConflictDoUpdate({
        target: rawPosts.xPostId,
        set: {
          text: mock.text,
          url,
          competitorId: competitor?.id ?? null,
          postedAt,
        },
      })
      .returning();

    if (!post) continue;

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

    if (
      signal &&
      classification.score >= threshold &&
      (classification.label === "launch" || classification.label === "feature")
    ) {
      await db
        .insert(alerts)
        .values({ signalId: signal.id, status: "new" })
        .onConflictDoNothing();
      alertCount += 1;
    }
  }

  await client.end();
  console.log(
    `Seed complete: ${competitorRows.length} competitors, ${KEYWORDS.length} keywords, ${MOCK_POSTS.length} posts, ${alertCount} launch/feature alerts.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
