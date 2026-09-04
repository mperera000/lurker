"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { AlertCard, AlertStatus } from "@/lib/alerts";
import { formatRelativeTime, formatScore } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FILTERS: { id: AlertStatus | "all"; label: string }[] = [
  { id: "new", label: "New" },
  { id: "seen", label: "Seen" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" },
];

export function AlertFeed({
  initialItems,
  initialStatus,
}: {
  initialItems: AlertCard[];
  initialStatus: AlertStatus | "all";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load(next: AlertStatus | "all") {
    setStatus(next);
    try {
      const response = await fetch(`/api/alerts?status=${next}`);
      if (!response.ok) throw new Error("Failed to load alerts");
      const data = (await response.json()) as { items: AlertCard[] };
      setItems(data.items);
      router.replace(next === "new" ? "/" : `/?status=${next}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load alerts");
    }
  }

  async function patchStatus(id: string, next: AlertStatus) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("Could not update alert");
      toast.success(next === "seen" ? "Marked seen" : "Dismissed");
      setItems((current) =>
        status === "all"
          ? current.map((item) =>
              item.id === id ? { ...item, status: next } : item,
            )
          : current.filter((item) => item.id !== id),
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Alert feed</h1>
          <p className="text-xs text-muted-foreground">
            Newest launch and feature signals first.
          </p>
        </div>
        <div className="flex rounded-md border border-border p-0.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => load(filter.id)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                status === filter.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyAlerts status={status} />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.label === "launch"
                            ? "launch"
                            : item.label === "feature"
                              ? "feature"
                              : "noise"
                        }
                      >
                        {item.label}
                      </Badge>
                      <span className="text-sm font-semibold">
                        {item.competitorName ?? `@${item.authorUsername}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{item.authorUsername}
                      </span>
                    </div>
                    <p className="max-w-3xl text-sm leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {formatScore(item.score)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(item.postedAt)}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {item.rationale}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <ExternalLink />
                      Open on X
                    </a>
                  </Button>
                  {item.status !== "seen" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pendingId === item.id}
                      onClick={() => patchStatus(item.id, "seen")}
                    >
                      Seen
                    </Button>
                  ) : null}
                  {item.status !== "dismissed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pendingId === item.id}
                      onClick={() => patchStatus(item.id, "dismissed")}
                    >
                      Dismiss
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyAlerts({ status }: { status: AlertStatus | "all" }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-8 text-center">
        <p className="text-sm font-medium">No {status === "all" ? "" : `${status} `}alerts</p>
        <p className="mx-auto max-w-lg text-xs leading-relaxed text-muted-foreground">
          Seed Voice AI mock data so the feed works before X credentials exist:
        </p>
        <pre className="mx-auto inline-block rounded-md bg-muted px-3 py-2 text-left text-[11px]">
          pnpm db:migrate && pnpm db:seed
        </pre>
      </CardContent>
    </Card>
  );
}
