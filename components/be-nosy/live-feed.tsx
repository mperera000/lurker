"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mockAccounts, mockPosts } from "@/components/be-nosy/mock-data";

export function LiveFeed() {
  const [filter, setFilter] = useState("all");
  const [slackOn, setSlackOn] = useState(false);

  const posts = useMemo(
    () =>
      mockPosts.filter(
        (post) => filter === "all" || post.handle === filter,
      ),
    [filter],
  );

  return (
    <div className="min-h-svh bg-white px-6 py-10 text-black sm:px-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-be-display text-3xl tracking-[-0.02em]">
          Lurk
        </Link>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/mock/accounts?from=feed"
            className="rounded-[21px] border-[1.5px] border-black px-5 py-2.5 font-be-mono text-base"
          >
            Edit watches
          </Link>
          <button
            type="button"
            onClick={() => setSlackOn((value) => !value)}
            className="rounded-[21px] bg-[rgba(231,70,93,0.74)] px-5 py-2.5 font-be-mono text-base"
          >
            {slackOn ? "Slack connected" : "Add to Slack"}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-be-display text-[clamp(2rem,5vw,3rem)]">
          Live posts
        </h1>
        <p className="font-be-mono text-base text-black/80">
          Launches and new features from the accounts you watch. Filter the same
          list you picked. Slack is optional.
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All accounts"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {mockAccounts.map((account) => (
            <FilterChip
              key={account.handle}
              label={account.name}
              active={filter === account.handle}
              onClick={() => setFilter(account.handle)}
            />
          ))}
        </div>
        {posts.length === 0 ? (
          <p className="font-be-mono text-base text-black/70">
            Watching this account. No launches or new features yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-2xl border border-black/15 px-6 py-5"
              >
                <div className="flex flex-wrap items-center gap-3 font-be-mono text-sm">
                  <span>
                    {post.company} @{post.handle}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 ${
                      post.label === "launch"
                        ? "bg-[rgba(231,70,93,0.74)]"
                        : "bg-[#d9d9d9]"
                    }`}
                  >
                    {post.label}
                  </span>
                  <span className="text-black/60">{post.when}</span>
                </div>
                <p className="mt-3 font-be-mono text-lg">{post.summary}</p>
                <a
                  href={`https://x.com/${post.handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-[21px] bg-[rgba(231,70,93,0.74)] px-4 py-2 font-be-mono text-sm"
                >
                  Open on X
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 font-be-mono text-sm ${
        active ? "bg-[rgba(231,70,93,0.74)]" : "bg-[#d9d9d9]"
      }`}
    >
      {label}
    </button>
  );
}
