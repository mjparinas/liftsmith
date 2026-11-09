// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyAppearance as applyTheme, isLight, savedAppearance as savedTheme } from "./appearance";
import { applyTheme as applyEarned, THEME_BY_ID } from "./themes";

function mockSystem(light: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: light && q.includes("light"), media: q, addEventListener() {}, removeEventListener() {} }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("appearance", () => {
  it("defaults to dark", () => {
    expect(savedTheme()).toBe("dark");
    applyTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("remembers the choice for the next launch", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(savedTheme()).toBe("light");
  });

  it("ignores a junk saved value", () => {
    localStorage.setItem("liftsmith.theme", "purple");
    expect(savedTheme()).toBe("dark");
  });

  it("resolves match system from the phone setting", () => {
    mockSystem(true);
    expect(isLight("system")).toBe(true);
    mockSystem(false);
    expect(isLight("system")).toBe(false);
    expect(isLight("light")).toBe(true);
    expect(isLight("dark")).toBe(false);
  });

  it("sets the browser bar colour to match", () => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
    applyTheme("light");
    expect(meta.content).toBe("#f4f6f9");
    applyTheme("dark");
    expect(meta.content).toBe("#0a0d12");
    meta.remove();
  });

  it("keeps light surfaces under an earned theme, and only darkens its accent", () => {
    const st = document.documentElement.style;
    const forge = THEME_BY_ID.get("forge")!;
    applyEarned(forge);
    expect(st.getPropertyValue("--color-bg")).toBe(forge.palette.bg);
    applyEarned(forge, true);
    expect(st.getPropertyValue("--color-bg")).toBe("");
    expect(st.getPropertyValue("--color-accent")).toContain("color-mix");
    applyEarned(THEME_BY_ID.get("midnight")!, true);
    expect(st.getPropertyValue("--color-accent")).toBe("");
  });
});
