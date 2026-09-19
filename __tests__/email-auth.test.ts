import { describe, expect, it } from "vitest";
import {
  displayNameFromEmail,
  isValidEmail,
  loginErrorMessage,
  normalizeEmail,
  signupErrorMessage,
} from "@/lib/auth/email";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("email helpers", () => {
  it("normalizes email and rejects junk", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(isValidEmail("ada@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("asks for a real email and a long enough password", () => {
    expect(signupErrorMessage({ email: "nope", password: "secret12" })).toMatch(
      /email/i,
    );
    expect(
      signupErrorMessage({ email: "ada@example.com", password: "short" }),
    ).toMatch(/8/);
    expect(
      signupErrorMessage({ email: "ada@example.com", password: "secret12" }),
    ).toBeNull();
  });

  it("uses the part before @ as a display name", () => {
    expect(displayNameFromEmail("ada@example.com")).toBe("ada");
  });

  it("explains a failed sign-in", () => {
    expect(loginErrorMessage("CredentialsSignin")).toMatch(/password/i);
  });
});

describe("password hash", () => {
  it("accepts the same password and rejects a wrong one", async () => {
    const stored = await hashPassword("secret12");
    expect(await verifyPassword("secret12", stored)).toBe(true);
    expect(await verifyPassword("wrong-pass", stored)).toBe(false);
  });
});
