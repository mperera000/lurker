"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CompetitorRow = {
  id: string;
  name: string;
  xUsername: string;
  active: boolean;
  industryName: string;
};

export function CompetitorsManager({
  initialItems,
  industryName,
}: {
  initialItems: CompetitorRow[];
  industryName: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [xUsername, setXUsername] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCompetitor(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, xUsername }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Create failed");
      setItems((current) => [
        {
          id: data.item.id,
          name: data.item.name,
          xUsername: data.item.xUsername,
          active: data.item.active,
          industryName,
        },
        ...current,
      ]);
      setName("");
      setXUsername("");
      toast.success("Competitor added");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: CompetitorRow, active: boolean) {
    setItems((current) =>
      current.map((item) => (item.id === row.id ? { ...item, active } : item)),
    );
    try {
      const response = await fetch(`/api/competitors/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!response.ok) throw new Error("Could not update competitor");
      toast.success(active ? "Activated" : "Deactivated");
      router.refresh();
    } catch (error) {
      setItems((current) =>
        current.map((item) =>
          item.id === row.id ? { ...item, active: row.active } : item,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function remove(row: CompetitorRow) {
    try {
      const response = await fetch(`/api/competitors/${row.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete competitor");
      setItems((current) => current.filter((item) => item.id !== row.id));
      toast.success("Removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Competitors</h1>
        <p className="text-xs text-muted-foreground">
          Roster for {industryName}. Toggle active to include in ingest.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add competitor</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={addCompetitor}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ElevenLabs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">X username</Label>
              <Input
                id="username"
                value={xUsername}
                onChange={(event) => setXUsername(event.target.value)}
                placeholder="elevenlabsio"
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No competitors yet. Run <code>pnpm db:seed</code> or add one above.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>X username</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    @{row.xUsername}
                  </TableCell>
                  <TableCell>{row.industryName}</TableCell>
                  <TableCell>
                    <Switch
                      checked={row.active}
                      onCheckedChange={(checked) => toggleActive(row, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(row)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
