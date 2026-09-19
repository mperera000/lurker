import { describe, expect, it } from "vitest";
import {
  companyIndustries,
  findUsIndustry,
  searchUsIndustries,
  usIndustries,
} from "@/lib/us-industries";

describe("searchUsIndustries", () => {
  it("finds US industries by a partial name", () => {
    const hits = searchUsIndustries("hospital");
    expect(hits.length).toBeGreaterThan(0);
    expect(
      hits.some((name) => name.toLowerCase().includes("hospital")),
    ).toBe(true);
  });

  it("covers the main NAICS sectors", () => {
    expect(usIndustries).toContain("Retail Trade");
    expect(usIndustries).toContain("Manufacturing");
    expect(usIndustries).toContain("Public Administration");
    expect(usIndustries.length).toBeGreaterThan(200);
  });

  it("lists company industries people type on X first", () => {
    expect(companyIndustries.slice(0, 3)).toEqual(["Tech", "AI", "Beauty"]);
    const open = searchUsIndustries("");
    expect(open.slice(0, 3)).toEqual(["Tech", "AI", "Beauty"]);
    expect(searchUsIndustries("tech")[0]).toBe("Tech");
    expect(searchUsIndustries("ai")[0]).toBe("AI");
    expect(searchUsIndustries("beauty")[0]).toBe("Beauty");
  });

  it("does not treat census titles as the old chips", () => {
    expect(usIndustries).not.toContain("Voice AI");
    expect(usIndustries).not.toContain("Dev tools");
  });

  it("says so when nothing matches", () => {
    expect(searchUsIndustries("zzzz-not-an-industry")).toEqual([]);
  });

  it("resolves a typed industry to the official name", () => {
    expect(findUsIndustry("beauty")).toBe("Beauty");
    expect(findUsIndustry("not-an-industry")).toBeNull();
  });

  it("lists company industries then every US industry when empty", () => {
    expect(searchUsIndustries("")).toEqual([
      ...companyIndustries,
      ...usIndustries,
    ]);
    expect(searchUsIndustries("   ")).toHaveLength(
      companyIndustries.length + usIndustries.length,
    );
  });
});
