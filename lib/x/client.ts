export type XTweet = {
  id: string;
  text: string;
  createdAt: string;
  authorId?: string;
  authorUsername: string;
  url: string;
  raw: Record<string, unknown>;
};

export type XUser = {
  id: string;
  username: string;
  name: string;
};

export class XApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "XApiError";
  }
}

const API_BASE = "https://api.x.com/2";

export function hasXCredentials(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN);
}

export class XClient {
  constructor(private readonly bearerToken: string) {}

  static fromEnv(): XClient | null {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) return null;
    return new XClient(token);
  }

  async getUserByUsername(username: string): Promise<XUser | null> {
    const handle = username.replace(/^@/, "");
    const data = await this.get<{
      data?: { id: string; username: string; name: string };
    }>(`/users/by/username/${encodeURIComponent(handle)}`);
    if (!data.data) return null;
    return data.data;
  }

  async getUserTweets(
    userId: string,
    username: string,
    maxResults = 10,
  ): Promise<XTweet[]> {
    const params = new URLSearchParams({
      max_results: String(Math.min(Math.max(maxResults, 5), 100)),
      "tweet.fields": "created_at,entities,author_id",
      exclude: "retweets,replies",
    });
    const data = await this.get<{
      data?: Array<{
        id: string;
        text: string;
        created_at?: string;
        author_id?: string;
      }>;
    }>(`/users/${encodeURIComponent(userId)}/tweets?${params.toString()}`);

    return (data.data ?? []).map((tweet) =>
      this.toTweet(tweet, username),
    );
  }

  async searchRecent(query: string, maxResults = 20): Promise<XTweet[]> {
    const params = new URLSearchParams({
      query,
      max_results: String(Math.min(Math.max(maxResults, 10), 100)),
      "tweet.fields": "created_at,entities,author_id",
      expansions: "author_id",
      "user.fields": "username,name",
    });
    const data = await this.get<{
      data?: Array<{
        id: string;
        text: string;
        created_at?: string;
        author_id?: string;
      }>;
      includes?: { users?: Array<{ id: string; username: string }> };
    }>(`/tweets/search/recent?${params.toString()}`);

    const users = new Map(
      (data.includes?.users ?? []).map((user) => [user.id, user.username]),
    );

    return (data.data ?? []).map((tweet) =>
      this.toTweet(
        tweet,
        (tweet.author_id && users.get(tweet.author_id)) || "unknown",
      ),
    );
  }

  private toTweet(
    tweet: {
      id: string;
      text: string;
      created_at?: string;
      author_id?: string;
    },
    username: string,
  ): XTweet {
    return {
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at ?? new Date().toISOString(),
      authorId: tweet.author_id,
      authorUsername: username,
      url: `https://x.com/${username}/status/${tweet.id}`,
      raw: tweet as Record<string, unknown>,
    };
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        "User-Agent": "competitive-launch-watcher/1.0",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.text();
      throw new XApiError(
        `X API ${response.status} for ${path}`,
        response.status,
        body,
      );
    }
    return (await response.json()) as T;
  }
}
