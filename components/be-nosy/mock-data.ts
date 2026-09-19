export const mockAccounts = [
  { name: "ElevenLabs", handle: "elevenlabsio" },
  { name: "Hume", handle: "hume_ai" },
  { name: "Deepgram", handle: "DeepgramAI" },
  { name: "OpenAI", handle: "OpenAI" },
  { name: "Vapi", handle: "Vapi_AI" },
] as const;

export const mockPosts = [
  {
    id: "1",
    company: "ElevenLabs",
    handle: "elevenlabsio",
    label: "launch" as const,
    when: "12m ago",
    summary: "Launching Instant Voice Clone v3 for product teams.",
  },
  {
    id: "2",
    company: "OpenAI",
    handle: "OpenAI",
    label: "feature" as const,
    when: "1h ago",
    summary: "Realtime voice API now generally available.",
  },
  {
    id: "3",
    company: "Hume",
    handle: "hume_ai",
    label: "feature" as const,
    when: "3h ago",
    summary: "New expression measurement model for call centers.",
  },
];
