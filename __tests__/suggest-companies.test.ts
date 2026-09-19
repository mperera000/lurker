import { describe, expect, it } from "vitest";
import { parseSuggestedCompetitors } from "@/lib/grok/suggest-companies";

describe("parseSuggestedCompetitors", () => {
  it("keeps five valid company handles and drops junk", () => {
    const accounts = parseSuggestedCompetitors(`
Here you go
[
  {"name":"Sephora","xUsername":"Sephora"},
  {"name":"Ulta","xUsername":"@UltaBeauty"},
  {"name":"Fake","xUsername":"not a handle"},
  {"name":"L'Oréal","xUsername":"Loreal"},
  {"name":"Glossier","xUsername":"glossier"},
  {"name":"Fenty","xUsername":"FentyBeauty"},
  {"name":"Extra","xUsername":"toomany"}
]
`);
    expect(accounts).toEqual([
      { name: "Sephora", xUsername: "Sephora" },
      { name: "Ulta", xUsername: "UltaBeauty" },
      { name: "L'Oréal", xUsername: "Loreal" },
      { name: "Glossier", xUsername: "glossier" },
      { name: "Fenty", xUsername: "FentyBeauty" },
    ]);
  });

  it("does not invent rows when Grok returns no JSON", () => {
    expect(parseSuggestedCompetitors("sorry, no companies")).toEqual([]);
  });
});
