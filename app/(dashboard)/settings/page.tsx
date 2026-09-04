import { SettingsForm } from "@/components/settings-form";
import { Card, CardContent } from "@/components/ui/card";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  try {
    const settings = await getAppSettings();
    if (!settings) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No settings yet. Run <code>pnpm db:seed</code> to create the Voice
            AI industry row.
          </CardContent>
        </Card>
      );
    }

    return (
      <SettingsForm
        initial={{
          industryName: settings.industry?.name ?? null,
          industrySlug: settings.industry?.slug ?? null,
          scoreThreshold: settings.scoreThreshold,
          cronNotes: settings.cronNotes,
          quietHoursStart: settings.quietHoursStart,
          quietHoursEnd: settings.quietHoursEnd,
        }}
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
