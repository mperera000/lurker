import { NextResponse } from "next/server";
import { auth, isAuthConfigured } from "@/lib/auth";

export async function requireSession() {
  if (!isAuthConfigured()) return null;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
