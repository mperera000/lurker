import { AppNav } from "@/components/app-nav";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    return children;
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AppNav />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
