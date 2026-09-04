import { desc, eq } from "drizzle-orm";
import { CompetitorsManager } from "@/components/competitors-manager";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { competitors, industries } from "@/lib/db/schema";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  try {
    const settings = await getAppSettings();
    const items = await db
      .select({
        id: competitors.id,
        name: competitors.name,
        xUsername: competitors.xUsername,
        active: competitors.active,
        industryName: industries.name,
      })
      .from(competitors)
      .innerJoin(industries, eq(competitors.industryId, industries.id))
      .orderBy(desc(competitors.createdAt));

    return (
      <CompetitorsManager
        initialItems={items}
        industryName={settings?.industry?.name ?? "Unseeded industry"}
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
