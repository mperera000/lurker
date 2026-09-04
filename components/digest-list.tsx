"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";

export type DigestRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  preview: string;
};

export function DigestList({ initialItems }: { initialItems: DigestRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const response = await fetch("/api/digests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: 24 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Generate failed");
      toast.success("Digest generated");
      setItems((current) => [
        {
          id: data.item.id,
          periodStart: data.item.periodStart,
          periodEnd: data.item.periodEnd,
          createdAt: data.item.createdAt,
          preview: String(data.item.bodyMd ?? "").slice(0, 160),
        },
        ...current,
      ]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Digests</h1>
          <p className="text-xs text-muted-foreground">
            24h rollup of high-score launch and feature signals.
          </p>
        </div>
        <Button onClick={generate} disabled={busy}>
          Generate last 24h
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-8 text-center">
            <p className="text-sm font-medium">No digests yet</p>
            <p className="text-xs text-muted-foreground">
              Generate one from seeded mock alerts, or after a live ingest run.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/digests/${item.id}`}>
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {new Date(item.periodStart).toLocaleString()} →{" "}
                      {new Date(item.periodEnd).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.preview}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
