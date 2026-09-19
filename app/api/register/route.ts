import { NextResponse } from "next/server";
import {
  normalizeEmail,
  signupErrorMessage,
} from "@/lib/auth/email";
import { jsonError } from "@/lib/api";
import { createUser } from "@/lib/users";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return jsonError("Enter an email and password.");
  }

  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");
  const invalid = signupErrorMessage({ email, password });
  if (invalid) return jsonError(invalid);

  try {
    const user = await createUser({ email, password });
    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not create the account. Try again.";
    console.error("[auth] register failed", message);
    return jsonError(message);
  }
}
