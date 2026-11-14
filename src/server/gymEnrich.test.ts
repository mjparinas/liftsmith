import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { detailsFromHtml, enrichBatch, enrichPlace, hoursFromSpec, publicHost } from "./gymEnrich";
import { placesFromOsm, savePlaces, socialUrl, type OsmElement } from "./gymPlaces";

const NOW = 1_800_000_000_000;
const AREA = { city: "Langley", region: "BC", country: "CA" };
const GYM: OsmElement = {
  type: "node",
  id: 10,
  lat: 49.1,
  lon: -122.6,
  tags: { leisure: "fitness_centre", name: "Iron Works", website: "https://ironworks.example.com/" },
};

const PAGE = `<html><head><script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "Iron Works" },
    {
      "@type": ["LocalBusiness", "ExerciseGym"],
      telephone: "+1 604-555-0100",
      email: "hello@ironworks.example.com",
      address: { "@type": "PostalAddress", streetAddress: "100 Main St", postalCode: "V2Y 1A1" },
      openingHoursSpecification: [
        { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "05:00", closes: "23:00" },
        { dayOfWeek: "https://schema.org/Saturday", opens: "07:00:00", closes: "20:00:00" },
        { dayOfWeek: "Sunday", opens: "07:00", closes: "20:00" },
      ],
      sameAs: ["https://www.instagram.com/ironworksgym/", "https://facebook.com/ironworksgym"],
    },
  ],
})}</script></head><body><a href="mailto:design@agency.example.org">Site by Agency</a></body></html>`;

/** A fake web: robots.txt and a home page for one site. */
function site(robots: string | null, page: string, status = 200) {
  const calls: string[] = [];
  const fetcher = (async (url: string | URL | Request) => {
    const u = String(url);
    calls.push(u);
    if (u.endsWith("/robots.txt")) return robots === null ? new Response("", { status: 404 }) : new Response(robots);
    return new Response(page, { status, headers: { "content-type": "text/html; charset=utf-8" } });
  }) as typeof fetch;
  return { fetcher, calls };
}

beforeEach(async () => {
  await resetDb();
});

describe("reading a gym's website", () => {
  it("takes phone, email, address, postcode, hours and social pages from the page's structured data", () => {
    expect(detailsFromHtml(PAGE, "https://ironworks.example.com/")).toEqual({
      phone: "+1 604-555-0100",
      email: "hello@ironworks.example.com",
      address: "100 Main St",
      postcode: "V2Y 1A1",
      hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
      instagram: "https://www.instagram.com/ironworksgym",
      facebook: "https://www.facebook.com/ironworksgym",
    });
  });

  it("falls back to the page's links, and takes an email only on the gym's own domain", () => {
    const html = `<a href="tel:+16045550199">Call</a><a href="mailto:me@agency.example.org">x</a><a href="mailto:Info@ironworks.example.com?subject=hi">y</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=x">share</a><a href="https://www.instagram.com/iron_works/">ig</a>`;
    expect(detailsFromHtml(html, "https://www.ironworks.example.com/")).toMatchObject({
      phone: "+16045550199",
      email: "info@ironworks.example.com",
      instagram: "https://www.instagram.com/iron_works",
      facebook: "",
    });
    expect(detailsFromHtml(`<a href="mailto:me@agency.example.org">x</a>`, "https://ironworks.example.com").email).toBe("");
  });

  it("turns opening hours into the map's form, midnight closing included", () => {
    expect(hoursFromSpec({ dayOfWeek: "Friday", opens: "6:00", closes: "00:00" })).toBe("Fr 06:00-24:00");
    expect(hoursFromSpec([{ dayOfWeek: "Funday", opens: "06:00", closes: "22:00" }])).toBe("");
    expect(hoursFromSpec(null)).toBe("");
  });

  it("reads only public web addresses", () => {
    expect(publicHost("https://ironworks.example.com/")).toBe(true);
    for (const bad of [
      "http://localhost/",
      "http://127.0.0.1/",
      "http://169.254.169.254/latest",
      "http://[::1]/",
      "ftp://x.com",
      "http://nas.local/",
      "https://x.com:8443/",
    ])
      expect(publicHost(bad)).toBe(false);
  });

  it("makes social links from handles and links, and refuses other sites", () => {
    expect(socialUrl("@ironworks", "instagram")).toBe("https://www.instagram.com/ironworks");
    expect(socialUrl("https://m.facebook.com/ironworks/?ref=x", "facebook")).toBe("https://www.facebook.com/ironworks");
    expect(socialUrl("https://www.instagram.com/ironworks", "facebook")).toBe("");
    expect(socialUrl("not a handle!", "instagram")).toBe("");
  });
});

describe("filling in a gym", () => {
  it("fills only empty fields, never a claimed gym, and a later map import never blanks them", async () => {
    await savePlaces(placesFromOsm([{ ...GYM, tags: { ...GYM.tags!, phone: "604-555-0000" } }], AREA), NOW);
    const [p] = await query("SELECT id, name, website, phone FROM gym_places");
    const { fetcher } = site(null, PAGE);
    const r = await enrichPlace(
      { id: String(p!.id), name: "Iron Works", website: String(p!.website), phone: String(p!.phone) },
      fetcher,
      NOW,
    );
    expect(r.filled.sort()).toEqual(["address", "email", "facebook", "hours", "instagram", "postcode"]);
    const [after] = await query("SELECT phone, email, hours, postcode, enriched_at FROM gym_places");
    expect(after).toMatchObject({ phone: "604-555-0000", email: "hello@ironworks.example.com", postcode: "V2Y 1A1", enriched_at: NOW });
    // The map still has no hours or email: the next import keeps what the website gave.
    expect(await savePlaces(placesFromOsm([{ ...GYM, tags: { ...GYM.tags!, phone: "604-555-0000" } }], AREA), NOW + 1)).toMatchObject({
      unchanged: 1,
    });
    expect((await query("SELECT hours FROM gym_places"))[0]!.hours).toBe("Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00");

    await run("UPDATE gym_places SET claimed_by = 'acc-owner', email = '', enriched_at = 0");
    await enrichPlace({ id: String(p!.id), name: "Iron Works", website: String(p!.website) }, fetcher, NOW + 2);
    expect((await query("SELECT email FROM gym_places"))[0]!.email).toBe("");
  });

  it("reads the home page even when robots.txt says no, and nothing else", async () => {
    await savePlaces(placesFromOsm([GYM], AREA), NOW);
    const [p] = await query("SELECT id FROM gym_places");
    const { fetcher, calls } = site("User-agent: *\nDisallow: /", PAGE);
    const r = await enrichPlace({ id: String(p!.id), name: "Iron Works", website: "https://ironworks.example.com/" }, fetcher, NOW);
    expect(r.filled).toContain("hours");
    expect(calls).toEqual(["https://ironworks.example.com/"]);
  });

  it("reads gyms in batches, each at most once a month, and counts what's left", async () => {
    await savePlaces(
      placesFromOsm(
        [
          GYM,
          { ...GYM, id: 11, tags: { ...GYM.tags!, name: "Bar Barn" } },
          { ...GYM, id: 12, tags: { leisure: "fitness_centre", name: "No Site" } },
        ],
        AREA,
      ),
      NOW,
    );
    const { fetcher } = site(null, "<html><body>Hi</body></html>");
    const first = await enrichBatch(fetcher, NOW);
    expect(first.done.map((d) => d.skipped)).toEqual(["nothing new on the page", "nothing new on the page"]);
    expect(first.left).toBe(0);
    expect((await enrichBatch(fetcher, NOW + 1000)).done).toHaveLength(0);
    expect((await enrichBatch(fetcher, NOW + 31 * 86_400_000)).done).toHaveLength(2);
  });
});

describe("what the map says", () => {
  it("keeps the unit, postcode, email, social pages and wheelchair access", () => {
    const [d] = placesFromOsm(
      [
        {
          ...GYM,
          tags: {
            ...GYM.tags!,
            "addr:unit": "4",
            "addr:housenumber": "100",
            "addr:street": "Main St",
            "addr:postcode": "V2Y 1A1",
            "contact:email": "Hi@IronWorks.example.com",
            "contact:instagram": "ironworksgym",
            "contact:facebook": "https://www.facebook.com/ironworksgym",
            wheelchair: "limited",
          },
        },
      ],
      AREA,
    );
    expect(d).toMatchObject({
      address: "4-100 Main St",
      postcode: "V2Y 1A1",
      email: "hi@ironworks.example.com",
      instagram: "https://www.instagram.com/ironworksgym",
      facebook: "https://www.facebook.com/ironworksgym",
      wheelchair: "limited",
    });
  });
});
