import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/markdown-body";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { digests } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const digest = await db.query.digests.findFirst({
    where: eq(digests.id, id),
  });
  if (!digest) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Digest</h1>
          <p className="text-xs text-muted-foreground">
            {digest.periodStart.toLocaleString()} →{" "}
            {digest.periodEnd.toLocaleString()}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/digests">Back</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-5">
          <MarkdownBody markdown={digest.bodyMd} />
        </CardContent>
      </Card>
    </div>
  );
}
