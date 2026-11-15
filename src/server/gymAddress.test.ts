import { describe, expect, it } from "vitest";

import { badCity, cityName, isPostcode, km, postcodeFor, sameCity, tidyAddress } from "./gymAddress";

describe("city names", () => {
  it("never takes a postcode or a house number for a city", () => {
    for (const v of ["80145", "1", "6337", "V2Y 1A1", "SW1A 1AA", "150-0001", "", "  ", "12-3"]) expect(cityName(v)).toBe("");
  });

  it("finds the city inside a value that has a postcode or region with it", () => {
    expect(cityName("80145 Napoli")).toBe("Napoli");
    expect(cityName("Napoli 80145")).toBe("Napoli");
    expect(cityName("D-10115 Berlin")).toBe("Berlin");
    expect(cityName("Toronto, ON")).toBe("Toronto");
    expect(cityName("80145, Napoli")).toBe("Napoli");
    expect(cityName("浜松市")).toBe("浜松市");
    expect(cityName("Saint-Jean-sur-Richelieu")).toBe("Saint-Jean-sur-Richelieu");
  });

  it("calls a saved city bad when it isn't a clean name", () => {
    expect(badCity("80145")).toBe(true);
    expect(badCity("")).toBe(true);
    expect(badCity("80145 Napoli")).toBe(true);
    expect(badCity("Langley")).toBe(false);
    expect(badCity("北九州市")).toBe(false);
  });

  it("matches the same city however it's written", () => {
    expect(sameCity("Montréal", "montreal")).toBe(true);
    expect(sameCity("New York City", "New York")).toBe(true);
    expect(sameCity("Langley", "Surrey")).toBe(false);
    expect(sameCity("", "Surrey")).toBe(false);
  });
});

describe("addresses", () => {
  it("drops stray commas, repeated parts and the city, region and postcode at the end", () => {
    expect(tidyAddress("12, , Park Street, Kolkata, Kolkata", { city: "Kolkata" })).toBe("12, Park Street");
    expect(tidyAddress(" 100 Main St ,Langley, BC V2Y 1A1", { city: "Langley", region: "BC" })).toBe("100 Main St");
    expect(tidyAddress("4th Cross Road,, Indiranagar,", { city: "Bengaluru" })).toBe("4th Cross Road, Indiranagar");
    expect(tidyAddress("23, Ballygunge Place, Kolkata, West Bengal 700019", { city: "Kolkata", region: "West Bengal" })).toBe(
      "23, Ballygunge Place",
    );
  });

  it("gives nothing for a unit or number with no street, but keeps Japanese block numbers", () => {
    expect(tidyAddress("109-")).toBe("");
    expect(tidyAddress("12")).toBe("");
    expect(tidyAddress("1-2-3")).toBe("1-2-3");
    expect(tidyAddress("")).toBe("");
  });

  it("keeps the only part even when it's the city's name", () => {
    expect(tidyAddress("Kolkata", { city: "Kolkata" })).toBe("Kolkata");
  });

  it("checks a postcode against its country's shape", () => {
    expect(postcodeFor("v2y 1a1", "CA")).toBe("V2Y 1A1");
    expect(postcodeFor("12345", "CA")).toBe("");
    expect(postcodeFor("90210", "US")).toBe("90210");
    expect(postcodeFor("700019", "IN")).toBe("700019");
    expect(postcodeFor("ABC", "ZZ")).toBe("");
    expect(postcodeFor("1000", "ZZ")).toBe("1000");
    expect(isPostcode("80145")).toBe(true);
  });

  it("measures distance in km", () => {
    expect(Math.round(km({ lat: 49.1, lon: -122.6 }, { lat: 49.2, lon: -122.6 }))).toBe(11);
  });
});
