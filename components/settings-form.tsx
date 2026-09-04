"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type SettingsPayload = {
  industryName: string | null;
  industrySlug: string | null;
  scoreThreshold: number;
  cronNotes: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

export function SettingsForm({ initial }: { initial: SettingsPayload }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industryName: form.industryName,
          scoreThreshold: Number(form.scoreThreshold),
          cronNotes: form.cronNotes,
          quietHoursStart: form.quietHoursStart || null,
          quietHoursEnd: form.quietHoursEnd || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      setForm({
        industryName: data.item.industryName,
        industrySlug: data.item.industrySlug,
        scoreThreshold: data.item.scoreThreshold,
        cronNotes: data.item.cronNotes,
        quietHoursStart: data.item.quietHoursStart,
        quietHoursEnd: data.item.quietHoursEnd,
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Industry-agnostic config. Swap roster and keywords later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Watch configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry name</Label>
            <Input
              id="industry"
              value={form.industryName ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  industryName: event.target.value,
                }))
              }
            />
            {form.industrySlug ? (
              <p className="text-[11px] text-muted-foreground">
                Slug: {form.industrySlug}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="threshold">Score threshold</Label>
            <Input
              id="threshold"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={form.scoreThreshold}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  scoreThreshold: Number(event.target.value),
                }))
              }
            />
            <p className="text-[11px] text-muted-foreground">
              Alerts fire at ≥ threshold with label launch or feature. Default
              0.65. Launch label starts at 0.75.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qh-start">Quiet hours start</Label>
            <Input
              id="qh-start"
              type="time"
              value={form.quietHoursStart ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quietHoursStart: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qh-end">Quiet hours end</Label>
            <Input
              id="qh-end"
              type="time"
              value={form.quietHoursEnd ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quietHoursEnd: event.target.value,
                }))
              }
            />
            <p className="text-[11px] text-muted-foreground">
              Stored only in v1. Enforcement comes later.
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cron">Cron notes</Label>
            <Textarea
              id="cron"
              rows={6}
              value={form.cronNotes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cronNotes: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Button type="submit" disabled={busy}>
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
