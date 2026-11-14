import { describe, expect, it } from "vitest";

import { IMPORT_COUNTRIES, importCountryList, isImportCountry, MAJOR_CITIES } from "./majorCities";

describe("major cities to import", () => {
  it("covers every Play country, each with its cities written so Nominatim finds the right one", () => {
    const list = importCountryList();
    expect(list.length).toBeGreaterThanOrEqual(95);
    expect(list.map((c) => c.code)).toEqual(
      expect.arrayContaining(["CA", "US", "GB", "AU", "MX", "FR", "DE", "IT", "JP", "VA", "LI", "SM"]),
    );
    expect(list.map((c) => c.code)).toContain("CU");
    expect(MAJOR_CITIES.CU).toContain("Havana, Cuba");
    for (const c of list) expect(c.cities).toBeGreaterThan(0);
    expect(MAJOR_CITIES.GB).toContain("London, United Kingdom");
    expect(MAJOR_CITIES.CA).toContain("Langley, BC");
  });

  it("has no city twice and no blank names", () => {
    const all = Object.values(IMPORT_COUNTRIES).flatMap((c) => c.cities);
    expect(new Set(all).size).toBe(all.length);
    for (const city of all) expect(city).toMatch(/^\S.*, \S.*$/);
  });

  it("knows its country codes", () => {
    expect(isImportCountry("JP")).toBe(true);
    expect(isImportCountry("CU")).toBe(true);
    expect(isImportCountry("XX")).toBe(false);
    expect(isImportCountry("toString")).toBe(false);
  });
});
