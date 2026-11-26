import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { isAdminLink } from "./adminLink";
import { APP_LINK_PATHS, hashFromLink } from "./appLinks";
import { routineUrl } from "./routineShare";

// Android App Links (Melvin, 2026-11-11): links into the web app open the installed app on that screen.

describe("app links", () => {
  it("opens the screen in a shared link", () => {
    expect(hashFromLink(routineUrl("r1~QQ~bench-press.3"))).toBe("#/routine/r1~QQ~bench-press.3");
    expect(hashFromLink("https://www.getliftsmith.com/app/#/remix/1~bench-press.3.5.90")).toBe("#/remix/1~bench-press.3.5.90");
    expect(hashFromLink("https://www.getliftsmith.com/app/index.html#/stats")).toBe("#/stats");
    expect(hashFromLink("https://www.getliftsmith.com/app")).toBe("#/today");
  });

  it("opens invite links on the invite screen, and keeps an invite a shared link carries", () => {
    expect(hashFromLink("https://www.getliftsmith.com/invite/ABCDEFGH")).toBe("#/invite/ABCDEFGH");
    expect(hashFromLink("https://www.getliftsmith.com/invite/abcd-efgh/")).toBe("#/invite/ABCDEFGH");
    expect(hashFromLink("https://www.getliftsmith.com/invite/nope/")).toBe("#/today");
    expect(hashFromLink("https://www.getliftsmith.com/app/?invite=ABCDEFGH#/routine/r1~QQ")).toBe("#/routine/r1~QQ");
  });

  it("opens website pages on the matching app screen (Melvin, 2026-11-26)", () => {
    const at = (path: string) => hashFromLink(`https://www.getliftsmith.com${path}`);
    expect(at("/")).toBe("#/today");
    expect(at("/de/")).toBe("#/today");
    expect(at("/u/sam_lifts/")).toBe("#/person/sam_lifts");
    expect(at("/gyms/")).toBe("#/gyms");
    expect(at("/gyms/toronto/")).toBe("#/gyms");
    expect(at("/gyms/toronto/iron-house-gym/")).toBe("#/gymplace/toronto~iron-house-gym");
    expect(at("/gyms/toronto/iron-house-gym/?from=qr")).toBe("#/gymplace/toronto~iron-house-gym~qr");
    expect(at("/gym-chains/big-chain/")).toBe("#/gymchain/big-chain");
    expect(at("/routines/push-day-AbCdEf123456/")).toBe("#/library/AbCdEf123456");
    expect(at("/routines/")).toBe("#/library");
    expect(at("/community/")).toBe("#/community");
    expect(at("/community/roadmap/")).toBe("#/community/roadmap");
    expect(at("/community/add-dark-mode-AbCdEf123456/")).toBe("#/community/AbCdEf123456");
    expect(at("/exercises/bench-press/")).toBe("#/exercise/bench-press");
    expect(at("/fr/exercises/bench-press/")).toBe("#/exercise/bench-press");
    expect(at("/exercises/vs/bench-press-vs-push-up/")).toBe("#/exercises");
    expect(at("/exercises/")).toBe("#/exercises");
    expect(at("/programs/5x5/")).toBe("#/programs");
    expect(at("/tools/plate-calculator/")).toBe("#/tools/plates");
    expect(at("/tools/rpe-chart/")).toBe("#/tools");
    expect(at("/ja/pricing/")).toBe("#/pro");
  });

  it("ignores links that aren't into the app", () => {
    expect(hashFromLink("https://www.getliftsmith.com/blog/#/x")).toBeNull();
    expect(hashFromLink("https://www.getliftsmith.com/blog/some-post/")).toBeNull();
    expect(hashFromLink("https://www.getliftsmith.com/de/blog/")).toBeNull();
    expect(hashFromLink("https://www.getliftsmith.com/apps/")).toBeNull();
    // A paid program is bought on the website only (coach-programs.md), so its page never opens the app.
    expect(hashFromLink("https://www.getliftsmith.com/coach-programs/strong-AbCdEf123456/")).toBeNull();
    expect(hashFromLink("https://evil.example/app/#/routine/x")).toBeNull();
    expect(hashFromLink("http://www.getliftsmith.com/app/#/today")).toBeNull();
    expect(hashFromLink("liftsmith://start")).toBeNull();
    expect(hashFromLink("not a url")).toBeNull();
  });

  it("opens admin links in the app's browser tab, never as a screen (Melvin, 2026-11-26)", () => {
    for (const path of ["/admin", "/admin/", "/admin/?tab=System", "/api/admin/login/?token=abc"]) {
      const url = `https://www.getliftsmith.com${path}`;
      expect(isAdminLink(url), path).toBe(true);
      expect(hashFromLink(url), path).toBeNull();
    }
    expect(isAdminLink("https://www.getliftsmith.com/administration/")).toBe(false);
    expect(isAdminLink("https://www.getliftsmith.com/api/admin/flags/")).toBe(false);
    expect(isAdminLink("https://evil.example/admin/")).toBe(false);
    expect(isAdminLink("http://www.getliftsmith.com/admin/")).toBe(false);
  });

  it("claims exactly APP_LINK_PATHS on www in the manifest, verified, and each one opens a screen", () => {
    const manifest = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
    const filter = /<intent-filter android:autoVerify="true">([\s\S]*?)<\/intent-filter>/.exec(manifest)?.[1] ?? "";
    expect(filter).toContain('android:scheme="https"');
    const claimed = [...filter.matchAll(/android:(path|pathPrefix)="([^"]+)"/g)].map((m) =>
      m[1] === "path" ? { path: m[2] } : { prefix: m[2] },
    );
    expect(claimed).toEqual(APP_LINK_PATHS);
    expect(claimed.map((c) => c.prefix ?? "")).not.toContain("/coach-programs/");
    expect(new Set([...filter.matchAll(/android:host="([^"]+)"/g)].map((m) => m[1]))).toEqual(new Set(["www.getliftsmith.com"]));
    for (const c of APP_LINK_PATHS) {
      const url = `https://www.getliftsmith.com${c.path ?? `${c.prefix}x/`}`;
      expect(hashFromLink(url) !== null || isAdminLink(url), JSON.stringify(c)).toBe(true);
    }
  });

  it("sends website links tapped inside the Android app to the browser, not back to the app", () => {
    const main = readFileSync("android/app/src/main/java/com/getliftsmith/app/MainActivity.java", "utf8");
    expect(main).toContain("registerPlugin(SiteLinksPlugin.class)");
    const plugin = readFileSync("android/app/src/main/java/com/getliftsmith/app/SiteLinksPlugin.java", "utf8");
    expect(plugin).toContain("CATEGORY_APP_BROWSER");
    expect(plugin).toContain('"www.getliftsmith.com"');
  });

  it("publishes assetlinks.json for the app's package with SHA-256 fingerprints", () => {
    const links = JSON.parse(readFileSync("public/.well-known/assetlinks.json", "utf8")) as {
      relation: string[];
      target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
    }[];
    expect(links).toHaveLength(1);
    const [entry] = links;
    expect(entry!.relation).toContain("delegate_permission/common.handle_all_urls");
    expect(entry!.target.namespace).toBe("android_app");
    expect(entry!.target.package_name).toBe("com.getliftsmith.app");
    expect(entry!.target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
    for (const f of entry!.target.sha256_cert_fingerprints) expect(f).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  });
});
