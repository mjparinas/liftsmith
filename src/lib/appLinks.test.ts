import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { hashFromLink } from "./appLinks";
import { routineUrl } from "./routineShare";

// Android App Links (Melvin, 2026-11-11): links into the web app open the installed app on that screen.

describe("app links", () => {
  it("opens the screen in a shared link", () => {
    expect(hashFromLink(routineUrl("r1~QQ~bench-press.3"))).toBe("#/routine/r1~QQ~bench-press.3");
    expect(hashFromLink("https://www.getliftsmith.com/app/#/remix/1~bench-press.3.5.90")).toBe("#/remix/1~bench-press.3.5.90");
    expect(hashFromLink("https://www.getliftsmith.com/app/index.html#/stats")).toBe("#/stats");
    expect(hashFromLink("https://www.getliftsmith.com/app")).toBe("#/today");
  });

  it("ignores links that aren't into the app", () => {
    expect(hashFromLink("https://www.getliftsmith.com/blog/#/x")).toBeNull();
    expect(hashFromLink("https://evil.example/app/#/routine/x")).toBeNull();
    expect(hashFromLink("http://www.getliftsmith.com/app/#/today")).toBeNull();
    expect(hashFromLink("liftsmith://start")).toBeNull();
    expect(hashFromLink("not a url")).toBeNull();
  });

  it("claims /app on www in the manifest, verified, and nowhere else", () => {
    const manifest = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
    const filter = /<intent-filter android:autoVerify="true">([\s\S]*?)<\/intent-filter>/.exec(manifest)?.[1] ?? "";
    expect(filter).toContain('android:scheme="https"');
    expect(filter).toContain('android:host="www.getliftsmith.com"');
    expect(filter).toContain('android:pathPrefix="/app"');
    expect([...filter.matchAll(/android:host="([^"]+)"/g)].map((m) => m[1])).toEqual(["www.getliftsmith.com"]);
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
