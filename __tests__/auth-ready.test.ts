import { describe, expect, it } from "vitest";
import { isPublicAuthPath } from "@/lib/auth-ready";

describe("isPublicAuthPath", () => {
  it("lets the landing page, login, and auth callbacks through", () => {
    expect(isPublicAuthPath("/")).toBe(true);
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(isPublicAuthPath("/mock")).toBe(true);
    expect(isPublicAuthPath("/mock/accounts")).toBe(true);
    expect(isPublicAuthPath("/be-nosy/landing-mascot.png")).toBe(true);
    expect(isPublicAuthPath("/api/auth/session")).toBe(true);
    expect(isPublicAuthPath("/api/register")).toBe(true);
    expect(isPublicAuthPath("/api/cron/ingest")).toBe(true);
    expect(isPublicAuthPath("/api/industries/suggest")).toBe(true);
  });

  it("protects the rest of the dashboard", () => {
    expect(isPublicAuthPath("/competitors")).toBe(false);
    expect(isPublicAuthPath("/settings")).toBe(false);
  });
});
