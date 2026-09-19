"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { PillButton } from "@/components/be-nosy/pill-button";
import type { SuggestedCompetitor } from "@/lib/grok/suggest-companies";
import { searchUsIndustries } from "@/lib/us-industries";

const cap = 10;

export function AccountFilter({ fromFeed }: { fromFeed: boolean }) {
  const router = useRouter();
  const requestId = useRef(0);
  const [industryQuery, setIndustryQuery] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<SuggestedCompetitor[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [slackOn, setSlackOn] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const matches = useMemo(
    () => searchUsIndustries(industryQuery),
    [industryQuery],
  );

  async function loadAccounts(name: string) {
    const id = ++requestId.current;
    setLoading(true);
    setAccounts([]);
    setSelected([]);
    setNote(null);
    try {
      const response = await fetch("/api/industries/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: name }),
      });
      const data = (await response.json().catch(() => null)) as {
        accounts?: SuggestedCompetitor[];
        error?: string;
      } | null;
      if (id !== requestId.current) return;
      if (!response.ok || !data?.accounts?.length) {
        setNote(
          data?.error ??
            "Could not find companies in that industry. Try again or pick another industry.",
        );
        return;
      }
      setAccounts(data.accounts);
      setSelected(data.accounts.map((account) => account.xUsername));
    } catch {
      if (id !== requestId.current) return;
      setNote(
        "Could not find companies in that industry. Try again or pick another industry.",
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function toggle(xUsername: string) {
    setNote(null);
    setSelected((current) => {
      if (current.includes(xUsername)) {
        return current.filter((item) => item !== xUsername);
      }
      if (current.length >= cap) {
        setNote("10 is the free cap. More accounts later.");
        return current;
      }
      return [...current, xUsername];
    });
  }

  function pickIndustry(name: string) {
    setIndustry(name);
    setIndustryQuery(name);
    setOpen(false);
    void loadAccounts(name);
  }

  return (
    <div className="min-h-svh bg-white px-6 py-10 text-black sm:px-16">
      {fromFeed ? (
        <header className="mb-10">
          <Link
            href="/mock"
            className="font-be-mono text-sm text-black/70 underline-offset-4 hover:underline"
          >
            Back to live posts
          </Link>
        </header>
      ) : null}
      <main className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-be-display text-[clamp(2rem,5vw,3rem)]">
          {fromFeed ? "Edit who you lurk" : "Who should we lurk?"}
        </h1>
        <p className="font-be-mono text-base leading-7 text-black/80">
          Search Tech, AI, Beauty, or any US industry. Then keep suggested
          accounts, search a company, or find names you do not know. Cap is{" "}
          {cap}.
        </p>
        <div className="relative">
          <label className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="shrink-0 font-be-mono text-2xl">Industry</span>
            <input
              value={industryQuery}
              onChange={(event) => {
                setIndustryQuery(event.target.value);
                setIndustry(null);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setOpen(false), 120);
              }}
              placeholder="Search US industries"
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-controls="industry-results"
              className="h-[54px] w-full rounded-[23px] bg-[#d9d9d9] px-4 font-be-mono text-lg outline-none focus-visible:ring-2 focus-visible:ring-black"
            />
          </label>
          {open ? (
            <ul
              id="industry-results"
              className="absolute z-10 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-black/15 bg-white"
            >
              {matches.length === 0 ? (
                <li className="px-4 py-3 font-be-mono text-sm text-black/70">
                  No US industry matches that. Try another word.
                </li>
              ) : (
                matches.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickIndustry(name)}
                      className="w-full px-4 py-3 text-left font-be-mono text-sm hover:bg-[#f4f4f5]"
                    >
                      {name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
        {industry ? (
          <p className="font-be-mono text-sm text-black/70">
            Watching: {industry}
          </p>
        ) : null}
        <input
          type="search"
          placeholder="Search company or @handle"
          className="h-[54px] w-full rounded-[23px] bg-[#d9d9d9] px-5 font-be-mono text-lg outline-none focus-visible:ring-2 focus-visible:ring-black"
        />
        {loading ? (
          <p className="font-be-mono text-base text-black/70">
            Looking up the top companies on X in {industry}…
          </p>
        ) : null}
        {!loading && !industry ? (
          <p className="font-be-mono text-base text-black/70">
            Pick an industry to see the Top 5 companies with an X account.
          </p>
        ) : null}
        <ul>
          {accounts.map((account) => {
            const on = selected.includes(account.xUsername);
            return (
              <li key={account.xUsername} className="border-b border-black/10">
                <label className="flex cursor-pointer items-center gap-3 py-3 font-be-mono text-lg">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(account.xUsername)}
                    className="size-4 accent-[#e7465d]"
                  />
                  {account.name} @{account.xUsername}
                </label>
              </li>
            );
          })}
        </ul>
        {note ? (
          <div className="space-y-3">
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-be-mono text-sm text-red-700">
              {note}
            </p>
            {industry ? (
              <button
                type="button"
                onClick={() => void loadAccounts(industry)}
                className="font-be-mono text-sm underline underline-offset-4"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className="rounded-[21px] border-[1.5px] border-black px-6 py-3.5 font-be-mono text-lg"
          >
            Find companies I don&apos;t know
          </button>
          <PillButton
            type="button"
            className="h-auto py-3.5 text-lg"
            disabled={selected.length === 0}
            onClick={() => router.push("/mock")}
          >
            Watch these ({selected.length} / {cap})
          </PillButton>
          <button
            type="button"
            onClick={() => setSlackOn((value) => !value)}
            className="rounded-[21px] border-[1.5px] border-black px-6 py-3.5 font-be-mono text-lg"
          >
            {slackOn ? "Slack connected" : "Optional: Add to Slack"}
          </button>
        </div>
      </main>
    </div>
  );
}
