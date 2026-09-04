import { describe, expect, it } from "vitest";
import {
  classifyPost,
  DEFAULT_SCORE_THRESHOLD,
  type WatchKeyword,
} from "../lib/classifyPost";

const keywords: WatchKeyword[] = [
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

const elevenLabs = { name: "ElevenLabs", xUsername: "elevenlabsio" };

describe("classifyPost", () => {
  it("labels a competitor product launch as launch", () => {
    const result = classifyPost(
      {
        text: "We launched our new model today. Try the API: https://elevenlabs.io/v3",
        authorUsername: "elevenlabsio",
      },
      elevenLabs,
      keywords,
    );

    expect(result.label).toBe("launch");
    expect(result.score).toBeGreaterThanOrEqual(0.75);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.rationale).toMatch(/watched competitor/);
    expect(result.rationale).toMatch(/keywords/);
    expect(result.rationale).toMatch(/contains link/);
    expect(result.rationale).toMatch(/product nouns/);
    expect(result.summary).toMatch(/launched our new model/i);
  });

  it("labels a modest competitor update as feature", () => {
    const result = classifyPost(
      {
        text: "Shipping a small dashboard tweak this afternoon. Details: https://vapi.ai/changelog",
        authorUsername: "Vapi_AI",
      },
      { name: "Vapi", xUsername: "Vapi_AI" },
      keywords,
    );

    expect(result.label).toBe("feature");
    expect(result.score).toBeGreaterThanOrEqual(DEFAULT_SCORE_THRESHOLD);
    expect(result.score).toBeLessThan(0.75);
    expect(result.rationale).toMatch(/shipping/i);
    expect(result.rationale).not.toMatch(/product nouns/);
  });

  it("downranks hiring posts as noise", () => {
    const result = classifyPost(
      {
        text: "We're hiring a staff voice engineer. Come build with us!",
        authorUsername: "bland_ai",
      },
      { name: "Bland", xUsername: "bland_ai" },
      keywords,
    );

    expect(result.label).toBe("noise");
    expect(result.score).toBe(0);
    expect(result.rationale).toMatch(/downrank/);
    expect(result.rationale).toMatch(/hiring/i);
  });

  it("downranks meme posts as noise", () => {
    const result = classifyPost(
      {
        text: "This meme about voice clones made our team's day.",
        authorUsername: "playht",
      },
      { name: "PlayHT", xUsername: "playht" },
      keywords,
    );

    expect(result.label).toBe("noise");
    expect(result.score).toBe(0);
    expect(result.rationale).toMatch(/meme/);
  });

  it("treats an ambiguous non-competitor post as noise", () => {
    const result = classifyPost(
      {
        text: "Announcing nothing in particular, just thinking out loud.",
        authorUsername: "random_user",
      },
      null,
      keywords,
    );

    expect(result.label).toBe("noise");
    expect(result.score).toBeLessThan(DEFAULT_SCORE_THRESHOLD);
    expect(result.score).toBeCloseTo(0.15, 4);
    expect(result.rationale).toMatch(/announcing/i);
    expect(result.rationale).not.toMatch(/watched competitor/);
  });
});
