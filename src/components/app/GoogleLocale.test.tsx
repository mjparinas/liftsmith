// @vitest-environment jsdom
// Google's sign-in button speaks the app's language, not the browser's or the address's guess (Melvin saw
// "Continuar con Google" on an English page in an incognito window, 2026-11-13).
import { describe, expect, it } from "vitest";

import { googleLocale } from "./Account";

describe("googleLocale", () => {
  it("is the app's language, with the lifter's region when it's the same language", () => {
    expect(googleLocale("en", "en-CA")).toBe("en-CA");
    expect(googleLocale("es", "es-MX")).toBe("es-MX");
    expect(googleLocale("ja", "ja")).toBe("ja");
  });

  it("drops a region from another language", () => {
    expect(googleLocale("en", "es-ES")).toBe("en");
    expect(googleLocale("fr", "en-CA")).toBe("fr");
  });
});
