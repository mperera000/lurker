import { AccountFilter } from "@/components/be-nosy/account-filter";

export default async function MockAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  return <AccountFilter fromFeed={params.from === "feed"} />;
}
