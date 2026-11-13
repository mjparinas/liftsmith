// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeTestGym } from "@/test/factories";

import { cleanAmenities, cleanPrices, currencyFor, money } from "./gymExtras";
import { outOfOrder, refreshOutOfOrder, useOutOfOrder, withoutBroken } from "./gymExtrasApi";

describe("amenities and prices", () => {
  it("keep only known amenities, in their shown order, once each", () => {
    expect(cleanAmenities("sauna,showers,hottub,sauna")).toEqual(["showers", "sauna"]);
    expect(cleanAmenities(["freeTrial", "allHours"])).toEqual(["allHours", "freeTrial"]);
    expect(cleanAmenities(42)).toEqual([]);
  });

  it("tidy prices: two decimals, nothing negative or silly, null when none is set", () => {
    expect(cleanPrices({ currency: "USD", day: "12.345", week: -5, month: 1e9 })).toEqual({ currency: "USD", day: 12.35 });
    expect(cleanPrices('{"month":49}', "EUR")).toEqual({ currency: "EUR", month: 49 });
    expect(cleanPrices({ currency: "XYZ", day: 10 }, "GBP")).toEqual({ currency: "GBP", day: 10 });
    expect(cleanPrices({ day: "" })).toBeNull();
    expect(cleanPrices("not json")).toBeNull();
  });

  it("start in the gym's own currency and read naturally", () => {
    expect(currencyFor("US")).toBe("USD");
    expect(currencyFor("de")).toBe("EUR");
    expect(currencyFor("")).toBe("CAD");
    expect(money(15, "CAD", "en")).toBe("$15");
    expect(money(12.5, "EUR", "en")).toBe("€12.50");
  });
});

describe("equipment out of order", () => {
  beforeEach(() => {
    localStorage.clear();
    useOutOfOrder.setState({ byPlace: {} });
  });

  it("leaves reported equipment out of the gym the plan sees, only at that real gym", async () => {
    const gym = { ...makeTestGym(), placeId: "aaaaaaaaaaaaaaaa" };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ issues: [{ id: "1", equipment: "bench", kind: "broken", note: "", at: 0, reports: 1 }] })),
      ),
    );
    expect(await refreshOutOfOrder(gym.placeId, 10_000_000)).toBe(true);
    // Asked again soon after, nothing is fetched or changed.
    expect(await refreshOutOfOrder(gym.placeId, 10_000_001)).toBe(false);
    vi.unstubAllGlobals();
    expect(outOfOrder(gym)).toEqual(["bench"]);
    expect(withoutBroken(gym).equipment).not.toContain("bench");
    expect(withoutBroken(gym).equipment.length).toBe(gym.equipment.length - 1);
    // A gym of the lifter's own (no real gym behind it) is never changed.
    const home = makeTestGym();
    expect(withoutBroken(home)).toBe(home);
    // It's kept on the device for the next launch.
    expect(JSON.parse(localStorage.getItem("liftsmith.outOfOrder")!)).toHaveProperty(gym.placeId);
  });
});
