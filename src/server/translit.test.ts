// Gym addresses for names in other scripts (translit.ts, docs/decisions/seo.md "Gym addresses in other scripts").
import { describe, expect, it } from "vitest";

import { citySlugOf, slugify } from "./gymPlaces";
import { shortHash, translit } from "./translit";

describe("names in other scripts", () => {
  it("spells Cyrillic, Greek, Armenian, Georgian, Korean and kana in Latin letters", () => {
    expect(translit("Москва")).toBe("Moskva");
    expect(translit("Санкт-Петербург")).toBe("Sankt-Peterburg");
    expect(slugify("Кривий Ріг")).toBe("kriviy-rig");
    expect(slugify("София")).toBe("sofiya");
    expect(slugify("Београд")).toBe("beograd");
    expect(slugify("Θεσσαλονίκη")).toBe("thessaloniki");
    expect(slugify("Վանաձոր")).toBe("vanadzor");
    expect(slugify("თბილისი")).toBe("tbilisi");
    expect(slugify("서울특별시")).toBe("seoulteukbyeolsi");
    expect(slugify("エニタイムフィットネス")).toBe("enitaimufittonesu");
    expect(slugify("キャンプ", "シャワー", "ニッポン")).toBe("kyanpu-shawa-nippon");
  });

  it("leaves Latin text as it was, so no existing address changes", () => {
    expect(slugify("Steve Nash Fitness World", "Langley")).toBe("steve-nash-fitness-world-langley");
    expect(slugify("Montréal", "QC")).toBe("montreal-qc");
    expect(citySlugOf("Toronto", "ON")).toBe("toronto-on");
  });

  it("gives every other city its own folder, never the shared /gyms/gyms/", () => {
    const tokyo = citySlugOf("東京都", "");
    const karaj = citySlugOf("کرج", "البرز");
    expect(tokyo).toMatch(/^city-[0-9a-f]{8}$/);
    expect(karaj).toMatch(/^city-[0-9a-f]{8}$/);
    expect(tokyo).not.toBe(karaj);
    expect(citySlugOf("東京都", "")).toBe(tokyo);
    expect(citySlugOf("", "")).toBe("gyms");
    expect(shortHash("a")).toHaveLength(8);
  });
});
