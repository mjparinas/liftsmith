// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { lockNativeZoom, NATIVE_VIEWPORT } from "./nativeZoom";

const WEB = "width=device-width, initial-scale=1, viewport-fit=cover";

function setViewport(content: string) {
  document.head.innerHTML = `<meta name="viewport" content="${content}">`;
}

afterEach(() => {
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
  delete document.documentElement.dataset.native;
});

describe("lockNativeZoom", () => {
  it("leaves the web's viewport alone, so the website and web app still zoom", () => {
    setViewport(WEB);
    expect(lockNativeZoom()).toBe(false);
    expect(document.querySelector('meta[name="viewport"]')?.getAttribute("content")).toBe(WEB);
    expect(document.documentElement.dataset.native).toBeUndefined();
  });

  it("turns off pinch and double-tap zoom in the apps and keeps the full screen", () => {
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true };
    setViewport(WEB);
    expect(lockNativeZoom()).toBe(true);
    const content = document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "";
    expect(content).toBe(NATIVE_VIEWPORT);
    expect(content).toContain("user-scalable=no");
    expect(content).toContain("maximum-scale=1");
    expect(content).toContain("viewport-fit=cover");
    expect(document.documentElement.dataset.native).toBe("");
  });

  it("adds the viewport tag in the apps when the page has none", () => {
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true };
    document.head.innerHTML = "";
    lockNativeZoom();
    expect(document.querySelectorAll('meta[name="viewport"]')).toHaveLength(1);
  });
});
