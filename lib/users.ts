import { eq } from "drizzle-orm";
import { displayNameFromEmail } from "@/lib/auth/email";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

export async function findUserByEmail(email: string): Promise<User | null> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return existing ?? null;
}

export async function createUser(input: {
  email: string;
  password: string;
}): Promise<User> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const [created] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      displayName: displayNameFromEmail(input.email),
    })
    .returning();

  if (!created) {
    throw new Error("Could not create the account. Try again.");
  }

  console.info("[auth] created user", { userId: created.id, email: created.email });
  return created;
}

export async function verifyUser(
  email: string,
  password: string,
): Promise<User | null> {
  const existing = await findUserByEmail(email);
  if (!existing) return null;
  const ok = await verifyPassword(password, existing.passwordHash);
  if (!ok) {
    console.info("[auth] sign-in failed", { email });
    return null;
  }
  console.info("[auth] signed in", { userId: existing.id, email: existing.email });
  return existing;
}
