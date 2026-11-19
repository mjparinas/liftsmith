import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import {
  detailsFromHtml,
  enrichBatch,
  enrichPlace,
  hoursFromSpec,
  iconCandidates,
  imageSize,
  imageType,
  looksLikeStreet,
  manifestIcons,
  measureIcons,
  pickAddress,
  publicHost,
  siteIcon,
} from "./gymEnrich";
import { placeById, placesFromOsm, savePlaces, socialUrl, type OsmElement } from "./gymPlaces";

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

  it("survives a phone link with a stray %, which used to fail the whole batch", async () => {
    expect(detailsFromHtml(`<a href="tel:604-555-0199%">Call</a>`, "https://ironworks.example.com/").phone).toBe("604-555-0199");
    expect(detailsFromHtml(`<a href="tel:%2B1%20604">Call</a>`, "https://ironworks.example.com/").phone).toBe("+1 604");
    await savePlaces(placesFromOsm([GYM], AREA), NOW);
    const [p] = await query("SELECT id FROM gym_places");
    const { fetcher } = site(null, `<html><a href="tel:604-555-0199%zz">Call</a></html>`);
    const r = await enrichPlace({ id: String(p!.id), name: "Iron Works", website: "https://ironworks.example.com/" }, fetcher, NOW);
    expect(r.filled).toContain("phone");
    expect((await query("SELECT enriched_at FROM gym_places"))[0]!.enriched_at).toBe(NOW);
  });

  it("reads the home page even when robots.txt says no, and robots.txt isn't asked for", async () => {
    await savePlaces(placesFromOsm([GYM], AREA), NOW);
    const [p] = await query("SELECT id FROM gym_places");
    const { fetcher, calls } = site("User-agent: *\nDisallow: /", PAGE);
    const r = await enrichPlace({ id: String(p!.id), name: "Iron Works", website: "https://ironworks.example.com/" }, fetcher, NOW);
    expect(r.filled).toContain("hours");
    // The home page, then its icon (this page names none, so the usual places).
    expect(calls).toEqual([
      "https://ironworks.example.com/",
      "https://ironworks.example.com/apple-touch-icon.png",
      "https://ironworks.example.com/favicon.ico",
    ]);
  });

  it("reads gyms in batches, each at most once a month, and stamps one that has everything without a visit", async () => {
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
    expect(first.more).toBe(false);
    expect((await enrichBatch(fetcher, NOW + 1000)).done).toHaveLength(0);
    expect((await enrichBatch(fetcher, NOW + 31 * 86_400_000)).done).toHaveLength(2);
    // A full batch says there may be more.
    expect((await enrichBatch(fetcher, NOW + 62 * 86_400_000, 1)).more).toBe(true);
    // A gym with every detail and an icon isn't visited, only stamped.
    await run(
      `UPDATE gym_places SET phone = '1', email = 'a@b.co', hours = '24/7', address = '1 A St', postcode = 'V2Y 1A1',
         instagram = 'https://www.instagram.com/a', facebook = 'https://www.facebook.com/a', enriched_at = 0`,
    );
    await run("INSERT INTO gym_photos (id, place_id, kind, image, created_at) SELECT 'p' || id, id, 'icon', x'00', 0 FROM gym_places");
    await run("UPDATE gym_photos SET px = 180");
    const quiet = site(null, "");
    const stamped = await enrichBatch(quiet.fetcher, NOW + 63 * 86_400_000);
    expect(stamped).toMatchObject({ done: [], complete: 2 });
    expect(quiet.calls).toEqual([]);
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

/** A PNG header of this size, padded past the smallest icon we keep. */
function png(w: number, h: number) {
  const b = new Uint8Array(200).fill(7);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(b.buffer).setUint32(16, w);
  new DataView(b.buffer).setUint32(20, h);
  return b;
}

describe("the gym's own icon", () => {
  const PNG = png(32, 32);
  const HEAD = `<html><head><link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="icon" type="image/svg+xml" href="/icon.svg">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png"></head><body>Hi</body></html>`;

  it("tries the touch icon, then the largest icon, then the usual places, and never SVG", () => {
    expect(iconCandidates(HEAD, "https://ironworks.example.com/").map((c) => c.url)).toEqual([
      "https://ironworks.example.com/apple-touch-icon.png",
      "https://ironworks.example.com/favicon-32.png",
      "https://ironworks.example.com/favicon.ico",
    ]);
    expect(iconCandidates("<p>no head</p>", "https://ironworks.example.com/").map((c) => c.url)).toEqual([
      "https://ironworks.example.com/apple-touch-icon.png",
      "https://ironworks.example.com/favicon.ico",
    ]);
  });

  it("ranks sharp icons up to 512 px first, then bigger ones, then small ones, with og:image last", () => {
    const html = `<link rel="icon" sizes="16x16" href="/16.png"><link rel="icon" sizes="1024x1024" href="/1024.png">
      <link rel="icon" sizes="192x192" href="/192.png"><link rel="apple-touch-icon-precomposed" sizes="152x152" href="/152.png">
      <meta name="msapplication-TileImage" content="/tile.png"><meta name="msapplication-square310x310logo" content="/310.png">
      <meta property="og:image" content="https://cdn.example.com/hero.jpg"><link rel="icon" href="data:image/png;base64,AA==">`;
    expect(iconCandidates(html, "https://ironworks.example.com/").map((c) => new URL(c.url).pathname)).toEqual([
      "/310.png",
      "/192.png",
      "/apple-touch-icon.png",
      "/1024.png",
      "/152.png",
      "/tile.png",
      "/16.png",
      "/favicon.ico",
      "/hero.jpg",
    ]);
  });

  it("reads a manifest's icons, leaving out SVG and monochrome ones", () => {
    const json = JSON.stringify({
      icons: [
        { src: "icons/512.png", sizes: "512x512", type: "image/png" },
        { src: "icons/mask.png", sizes: "512x512", purpose: "maskable" },
        { src: "icons/mono.png", sizes: "512x512", purpose: "monochrome" },
        { src: "icons/logo.svg", sizes: "any", type: "image/svg+xml" },
        { src: "icons/192.png", sizes: "96x96 192x192" },
      ],
    });
    expect(manifestIcons(json, "https://ironworks.example.com/site.webmanifest")).toEqual([
      { url: "https://ironworks.example.com/icons/512.png", size: 512 },
      { url: "https://ironworks.example.com/icons/mask.png", size: 511 },
      { url: "https://ironworks.example.com/icons/192.png", size: 192 },
    ]);
    expect(manifestIcons("not json", "https://ironworks.example.com/m.json")).toEqual([]);
  });

  it("measures PNG, GIF, ICO, JPEG and WebP from their headers", () => {
    expect(imageSize(png(180, 180))).toEqual({ w: 180, h: 180 });
    expect(imageSize(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 48, 0, 48, 0, 0, 0]))).toEqual({ w: 48, h: 48 });
    // An .ico with a 16 px and a 256 px picture (0 means 256).
    const ico = new Uint8Array(6 + 32);
    ico.set([0, 0, 1, 0, 2, 0]);
    ico.set([16, 16], 6);
    ico.set([0, 0], 22);
    expect(imageSize(ico)).toEqual({ w: 256, h: 256 });
    // A JPEG with an APP0 segment before its frame header.
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 17, 8, 0, 120, 0, 160, 3, 0, 0]);
    expect(imageSize(jpeg)).toEqual({ w: 160, h: 120 });
    const webp = new Uint8Array(30);
    webp.set([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WEBPVP8X")]);
    webp.set([191, 0, 0, 191, 0, 0], 24);
    expect(imageSize(webp)).toEqual({ w: 192, h: 192 });
    expect(imageSize(new TextEncoder().encode("<html>not an image</html>"))).toBeNull();
  });

  it("takes the sharpest square icon, from the manifest when the page names nothing sharp, and og:image only as a last resort", async () => {
    const files: Record<string, Uint8Array<ArrayBuffer> | string> = {
      "/favicon-32.png": png(32, 32),
      "/site.webmanifest": JSON.stringify({ icons: [{ src: "/android-chrome-192.png", sizes: "192x192" }] }),
      "/android-chrome-192.png": png(192, 192),
      "/banner.png": png(1200, 630),
      "/square.png": png(400, 400),
    };
    const calls: string[] = [];
    const fetcher = (async (url: string | URL | Request) => {
      const path = new URL(String(url)).pathname;
      calls.push(path);
      const f = files[path];
      return f === undefined ? new Response("nope", { status: 404 }) : new Response(f);
    }) as typeof fetch;
    const page = `<link rel="icon" sizes="32x32" href="/favicon-32.png"><link rel="manifest" href="/site.webmanifest">`;
    expect((await siteIcon(fetcher, page, "https://ironworks.example.com/"))?.px).toBe(192);
    // It stopped at the first sharp one.
    expect(calls).toEqual(["/site.webmanifest", "/android-chrome-192.png"]);
    // Not bigger than the icon the gym already has: nothing.
    expect(await siteIcon(fetcher, page, "https://ironworks.example.com/", 192)).toBeNull();
    // A wide og:image is never taken; a square one is, but only when nothing else is there.
    expect(await siteIcon(fetcher, `<meta property="og:image" content="/banner.png">`, "https://ironworks.example.com/")).toBeNull();
    expect((await siteIcon(fetcher, `<meta property="og:image" content="/square.png">`, "https://ironworks.example.com/"))?.px).toBe(400);
    files["/favicon.ico"] = png(16, 16);
    expect((await siteIcon(fetcher, `<meta property="og:image" content="/square.png">`, "https://ironworks.example.com/"))?.px).toBe(16);
  });

  it("measures old icons once from their first bytes, and swaps a small one for a sharper one", async () => {
    await savePlaces(placesFromOsm([GYM], AREA), NOW);
    const [p] = await query("SELECT id FROM gym_places");
    const id = String(p!.id);
    await run("UPDATE gym_places SET enriched_at = ?", [NOW]);
    await run("INSERT INTO gym_photos (id, place_id, kind, image, created_at) VALUES ('0000000000000001', ?, 'icon', ?, 0)", [
      id,
      png(16, 16),
    ]);
    expect(await measureIcons()).toEqual({ measured: 1, small: 1 });
    expect(await query("SELECT px FROM gym_photos")).toEqual([{ px: 16 }]);
    // Moved to the front of the line, still counting as read for the AI step.
    expect(await query("SELECT enriched_at FROM gym_places")).toEqual([{ enriched_at: 1 }]);
    expect(await measureIcons()).toEqual({ measured: 0, small: 0 });
    const fetcher = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.endsWith("/apple-touch-icon.png")) return new Response(png(180, 180));
      return new Response("<html><body>Hi</body></html>", { headers: { "content-type": "text/html" } });
    }) as typeof fetch;
    const b = await enrichBatch(fetcher, NOW);
    expect(b.done[0]!.filled).toContain("icon");
    const [icon] = await query("SELECT id, px FROM gym_photos");
    expect(icon!.px).toBe(180);
    // A new id, so the forever-cached old picture isn't served for it.
    expect(icon!.id).not.toBe("0000000000000001");
    expect((await placeById(id))!.logo).toBe(icon!.id);
    // An owner's logo is never replaced by an icon, and a claimed gym's icon is left alone.
    await run("UPDATE gym_photos SET px = 16");
    await run("UPDATE gym_places SET claimed_by = 'acc-owner'");
    await enrichPlace({ id, name: "Iron Works", website: "https://ironworks.example.com/", iconPx: 16 }, fetcher, NOW + 1);
    expect(await query("SELECT px FROM gym_photos")).toEqual([{ px: 16 }]);
  });

  it("knows an image from its first bytes and refuses anything else", () => {
    expect(imageType(PNG)).toBe("image/png");
    expect(imageType(new Uint8Array([0, 0, 1, 0, 1, 0, 16, 16, 0, 0, 1, 0]))).toBe("image/x-icon");
    expect(imageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>x()</script></svg>'))).toBe("");
  });

  it("keeps the site's icon as the logo of an unclaimed gym, once, and never for a claimed one", async () => {
    await savePlaces(placesFromOsm([GYM], AREA), NOW);
    const [p] = await query("SELECT id FROM gym_places");
    const id = String(p!.id);
    const fetcher = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.endsWith("/apple-touch-icon.png"))
        return new Response("<html>not found page</html>", { headers: { "content-type": "text/html" } });
      if (u.endsWith("/favicon-32.png")) return new Response(PNG, { headers: { "content-type": "image/png" } });
      return new Response(HEAD, { headers: { "content-type": "text/html" } });
    }) as typeof fetch;
    const r = await enrichPlace({ id, name: "Iron Works", website: "https://ironworks.example.com/" }, fetcher, NOW);
    expect(r.filled).toContain("icon");
    const logo = (await placeById(id))!.logo;
    expect(logo).toMatch(/^[0-9a-f]{16}$/);
    await enrichPlace({ id, name: "Iron Works", website: "https://ironworks.example.com/" }, fetcher, NOW + 1);
    expect(await query("SELECT COUNT(*) AS n FROM gym_photos")).toEqual([{ n: 1 }]);
    // An owner's logo wins over the icon.
    await run("INSERT INTO gym_photos (id, place_id, kind, image, created_at) VALUES ('aaaaaaaaaaaaaaaa', ?, 'logo', ?, ?)", [
      id,
      new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      NOW + 2,
    ]);
    expect((await placeById(id))!.logo).toBe("aaaaaaaaaaaaaaaa");
    await run("DELETE FROM gym_photos");
    await run("UPDATE gym_places SET claimed_by = 'acc-owner'");
    expect(
      (await enrichPlace({ id, name: "Iron Works", website: "https://ironworks.example.com/" }, fetcher, NOW + 3)).filled,
    ).not.toContain("icon");
    expect(await query("SELECT COUNT(*) AS n FROM gym_photos")).toEqual([{ n: 0 }]);
  });
});

describe("addresses from a gym's website", () => {
  const near = { city: "Langley", region: "BC", country: "CA", lat: 49.1, lon: -122.66 };
  const ld = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

  it("takes the structured address when it's in the gym's city, tidied, with a postcode that fits the country", () => {
    const html = ld({
      "@type": "ExerciseGym",
      address: { "@type": "PostalAddress", streetAddress: "100 Main St,, Langley,", addressLocality: "Langley", postalCode: "v2y 1a1" },
    });
    expect(detailsFromHtml(html, "https://ironworks.example.com/", near)).toMatchObject({ address: "100 Main St", postcode: "V2Y 1A1" });
  });

  it("skips an address in another city, far from the gym, or one of several branches", () => {
    const other = ld({ "@type": "HealthClub", address: { streetAddress: "1 Head Office Way", addressLocality: "Toronto" } });
    expect(detailsFromHtml(other, "https://chain.example.com/", near).address).toBe("");
    const far = ld({ "@type": "HealthClub", address: { streetAddress: "1 Far Rd" }, geo: { latitude: 49.9, longitude: -123.5 } });
    expect(detailsFromHtml(far, "https://chain.example.com/", near).address).toBe("");
    const branches = ld([
      { "@type": "HealthClub", address: { streetAddress: "1 First Ave" } },
      { "@type": "HealthClub", address: { streetAddress: "2 Second Ave" } },
    ]);
    expect(detailsFromHtml(branches, "https://chain.example.com/", near).address).toBe("");
    // Of several branches, the one in this gym's city.
    const mixed = ld([
      { "@type": "HealthClub", address: { streetAddress: "1 First Ave", addressLocality: "Surrey" } },
      { "@type": "HealthClub", address: { streetAddress: "2 Second Ave", addressLocality: "Langley" } },
    ]);
    expect(detailsFromHtml(mixed, "https://chain.example.com/", near).address).toBe("2 Second Ave");
  });

  it("reads microdata", () => {
    const html = `<div itemscope itemtype="https://schema.org/PostalAddress"><span itemprop="streetAddress">20202 66 Ave</span>
      <span itemprop="addressLocality">Langley</span> <span itemprop="postalCode">V2Y 1P3</span></div>`;
    expect(detailsFromHtml(html, "https://ironworks.example.com/", near)).toMatchObject({ address: "20202 66 Ave", postcode: "V2Y 1P3" });
  });

  it("reads an address line in the footer only when the gym's city follows it", () => {
    const footer = `<footer><p>Iron Works Gym</p><p>20202 66 Ave, Unit 4<br>Langley, BC V2Y 1P3</p><p>Call 604-555-0199</p></footer>`;
    expect(detailsFromHtml(footer, "https://ironworks.example.com/", near)).toMatchObject({
      address: "20202 66 Ave, Unit 4",
      postcode: "V2Y 1P3",
    });
    const sameLine = `<address>5 Fraser Hwy, Langley, BC</address>`;
    expect(detailsFromHtml(sameLine, "https://ironworks.example.com/", near).address).toBe("5 Fraser Hwy");
    const designer = `<footer>Site by Pixel Co, 9 Granville St, Vancouver, BC</footer>`;
    expect(detailsFromHtml(designer, "https://ironworks.example.com/", near).address).toBe("");
    expect(detailsFromHtml(footer, "https://ironworks.example.com/").address).toBe("");
  });

  it("never takes a phone number, link or email for a street", () => {
    expect(looksLikeStreet("Call 604-555-0199")).toBe(false);
    expect(looksLikeStreet("info@ironworks.example.com")).toBe(false);
    expect(looksLikeStreet("www.ironworks.com")).toBe(false);
    expect(looksLikeStreet("20202 66 Ave")).toBe(true);
    expect(pickAddress([{ street: "Main", postcode: "", locality: "" }], near).address).toBe("");
  });
});
