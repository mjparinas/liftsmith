import { describe, expect, it } from "vitest";

import { scanTarget } from "./scanLink";

describe("scanTarget", () => {
  it("opens our invite, club and profile links", () => {
    expect(scanTarget("https://www.getliftsmith.com/app/#/invite/ABCD2345")).toEqual({ screen: "invite", arg: "ABCD2345" });
    expect(scanTarget("https://www.getliftsmith.com/app/#/club/abcd2345")).toEqual({ screen: "club", arg: "ABCD2345" });
    expect(scanTarget("https://www.getliftsmith.com/app/#/person/Blair_1")).toEqual({ screen: "person", arg: "blair_1" });
    expect(scanTarget("https://www.getliftsmith.com/u/blair/")).toEqual({ screen: "person", arg: "blair" });
    expect(scanTarget("  https://getliftsmith.com/u/blair  ")).toEqual({ screen: "person", arg: "blair" });
  });

  it("accepts the build's own host (a preview or local server)", () => {
    expect(scanTarget("http://localhost:3000/app/#/invite/ABCD2345", "localhost")).toEqual({ screen: "invite", arg: "ABCD2345" });
  });

  it("ignores anything else", () => {
    for (const junk of [
      "",
      "hello",
      "https://evil.example/app/#/invite/ABCD2345",
      "https://www.getliftsmith.com.evil.example/u/blair/",
      "javascript:alert(1)",
      "https://www.getliftsmith.com/app/#/invite/nope",
      "https://www.getliftsmith.com/app/#/settings",
      "https://www.getliftsmith.com/app/#/person/a",
      "https://www.getliftsmith.com/blog/",
    ])
      expect(scanTarget(junk)).toBeNull();
  });
});
