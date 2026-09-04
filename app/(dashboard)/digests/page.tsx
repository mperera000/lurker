import { desc } from "drizzle-orm";
import { DigestList } from "@/components/digest-list";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { digests } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function DigestsPage() {
  try {
    const rows = await db.select().from(digests).orderBy(desc(digests.createdAt));
    return (
      <DigestList
        initialItems={rows.map((row) => ({
          id: row.id,
          periodStart: row.periodStart.toISOString(),
          periodEnd: row.periodEnd.toISOString(),
          createdAt: row.createdAt.toISOString(),
          preview: row.bodyMd.slice(0, 180),
        }))}
      />
    );
  } catch {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Database not ready. Run <code>pnpm db:migrate && pnpm db:seed</code>.
        </CardContent>
      </Card>
    );
  }
}
