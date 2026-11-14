import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { appJsonLd, appOffers } from "./appSchema";

// Google's Search Console flagged the pricing page's `Product` as a merchant listing missing an image,
// availability, shipping, returns and a GTIN (2026-11-14). The app is software, so it's a MobileApplication.

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) && !p.includes(".test.") ? [p] : [];
  });
}

describe("app structured data", () => {
  it("never marks anything on the site as a Product (a merchant listing)", () => {
    const hits = files("src").filter((f) => /"@type":\s*"Product"/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  it("gives the app an image, a description and offers that say they're available", () => {
    const url = "https://www.getliftsmith.com/pricing/";
    const app = appJsonLd({ url, description: "Plans every workout.", lang: "en", offers: appOffers(url, true) });
    expect(app["@type"]).toBe("MobileApplication");
    expect(app.image.length).toBeGreaterThan(0);
    expect(app.description).toBeTruthy();
    expect(app.offers).toHaveLength(7);
    for (const o of app.offers) {
      expect(o.availability).toBe("https://schema.org/InStock");
      expect(o.url).toBe(url);
      expect(Number(o.price)).not.toBeNaN();
    }
    expect(appOffers(url).map((o) => o.name)).toEqual(["Free", "Pro monthly", "Pro yearly"]);
  });
});
