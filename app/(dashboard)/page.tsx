import { AlertFeed } from "@/components/alert-feed";
import { listAlerts, type AlertStatus } from "@/lib/alerts";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const raw = params.status ?? "new";
  const status = (
    ["new", "seen", "dismissed", "all"].includes(raw) ? raw : "new"
  ) as AlertStatus | "all";

  try {
    const items = await listAlerts(status);
    return <AlertFeed initialItems={items} initialStatus={status} />;
  } catch {
    return (
      <Card>
        <CardContent className="space-y-2 p-8 text-center">
          <p className="text-sm font-medium">Database not ready</p>
          <p className="text-xs text-muted-foreground">
            Set DATABASE_URL, then run:
          </p>
          <pre className="mx-auto inline-block rounded-md bg-muted px-3 py-2 text-left text-[11px]">
            pnpm db:migrate && pnpm db:seed
          </pre>
        </CardContent>
      </Card>
    );
  }
}
