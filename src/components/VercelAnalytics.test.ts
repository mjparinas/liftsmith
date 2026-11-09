import { describe, expect, it } from "vitest";
import { keepEvent } from "./VercelAnalytics";

const ev = (url: string) => ({ type: "pageview" as const, url });

describe("Vercel Web Analytics filter", () => {
  it("counts public pages without their query string", () => {
    expect(keepEvent(ev("https://www.getliftsmith.com/blog/deload/?utm_source=x"))?.url).toBe("https://www.getliftsmith.com/blog/deload/");
    expect(keepEvent(ev("https://www.getliftsmith.com/"))?.url).toBe("https://www.getliftsmith.com/");
  });
  it("never counts the app, the admin panel or the dashboard", () => {
    for (const p of ["/app/", "/app/index.html", "/admin/", "/me/"]) expect(keepEvent(ev(`https://www.getliftsmith.com${p}`))).toBeNull();
  });
  it("counts nothing when the browser sends Global Privacy Control", () => {
    expect(keepEvent(ev("https://www.getliftsmith.com/"), true)).toBeNull();
  });
  it("drops a malformed url", () => {
    expect(keepEvent(ev("not a url"))).toBeNull();
  });
});
