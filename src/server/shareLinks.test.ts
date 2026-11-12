import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import { query, resetDb } from "./db";
import {
  createLink,
  deleteLink,
  getImage,
  getLink,
  isId,
  LIMITS,
  listLinks,
  newId,
  PAGE_CSP,
  pageHtml,
  parseNew,
  type NewLink,
} from "./shareLinks";

const NOW = 1_800_000_000_000;
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
const body = (over: Record<string, unknown> = {}) => ({
  kind: "pr",
  title: "Barbell bench press",
  description: "100 kg × 5",
  lang: "fr",
  width: 1080,
  height: 1350,
  image: `data:image/jpeg;base64,${JPEG.toString("base64")}`,
  ...over,
});
const good = () => parseNew(body()) as NewLink;

beforeEach(async () => {
  await resetDb();
});

describe("checking a new link", () => {
  it("accepts a JPEG card of a known size and kind", () => {
    const l = good();
    expect(l).toMatchObject({ kind: "pr", title: "Barbell bench press", lang: "fr", width: 1080, height: 1350 });
    expect(l.image.equals(JPEG)).toBe(true);
  });

  it("refuses anything that isn't a card", () => {
    expect(parseNew(null)).toHaveProperty("error");
    expect(parseNew(body({ kind: "anything" }))).toHaveProperty("error");
    expect(parseNew(body({ title: "  " }))).toHaveProperty("error");
    expect(parseNew(body({ width: 4000 }))).toHaveProperty("error");
    expect(parseNew(body({ image: `data:image/png;base64,${JPEG.toString("base64")}` }))).toHaveProperty("error");
    expect(parseNew(body({ image: `data:image/jpeg;base64,${Buffer.from("<svg>").toString("base64")}` }))).toHaveProperty("error");
    const big = Buffer.concat([JPEG, Buffer.alloc(LIMITS.image)]);
    expect(parseNew(body({ image: `data:image/jpeg;base64,${big.toString("base64")}` }))).toHaveProperty("error");
  });

  it("trims long text and unknown languages", () => {
    const l = parseNew(body({ title: "x".repeat(500), lang: "xx" })) as NewLink;
    expect(l.title).toHaveLength(LIMITS.title);
    expect(l.lang).toBe("en");
  });
});

describe("links", () => {
  it("makes ids that can't be guessed and only accepts that shape", () => {
    const id = newId();
    expect(isId(id)).toBe(true);
    expect(newId()).not.toBe(id);
    expect(isId("../etc")).toBe(false);
  });

  it("stores, lists, serves and deletes a link for its owner only", async () => {
    const made = await createLink("acct-1", good(), NOW, "abcdefghij");
    expect(made).toMatchObject({ id: "abcdefghij", createdAt: NOW });
    expect((await listLinks("acct-1")).map((l) => l.id)).toEqual(["abcdefghij"]);
    expect(await listLinks("acct-2")).toEqual([]);
    expect((await getImage("abcdefghij"))?.equals(JPEG)).toBe(true);
    expect(await deleteLink("acct-2", "abcdefghij")).toBe(false);
    expect(await getLink("abcdefghij")).not.toBeNull();
    expect(await deleteLink("acct-1", "abcdefghij")).toBe(true);
    expect(await getLink("abcdefghij")).toBeNull();
    expect(await getImage("abcdefghij")).toBeNull();
  });

  it("caps links per day and per account", async () => {
    for (let i = 0; i < LIMITS.perDay; i++) expect(await createLink("a", good(), NOW)).not.toBe("slow");
    expect(await createLink("a", good(), NOW)).toBe("slow");
    for (let i = 0; i < LIMITS.perAccount; i++) await createLink("b", good(), NOW + i * 86_400_000);
    expect(await createLink("b", good(), NOW + 200 * 86_400_000)).toBe("full");
  });

  it("goes when the account is deleted", async () => {
    await createLink("acct-1", good(), NOW, "abcdefghij");
    await deleteAccount("acct-1", async () => null);
    expect(await query("SELECT id FROM share_links")).toEqual([]);
  });
});

describe("the public page", () => {
  it("unfurls with the card and is never indexed", async () => {
    await createLink("acct-1", good(), NOW, "abcdefghij");
    const html = pageHtml(await getLink("abcdefghij"));
    expect(html).toContain('property="og:image" content="https://www.getliftsmith.com/w/abcdefghij/card.jpg"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('lang="fr"');
    expect(html).toContain("Essayer Liftsmith");
    expect(html).not.toMatch(/<script/i);
    expect(PAGE_CSP).toContain("default-src 'none'");
    // The site's own header and footer, with followed links to our pages and no UTM tags on them.
    expect(html).toContain('href="/fr/pricing/"');
    expect(html).toContain('href="/privacy/"');
    expect(html).not.toMatch(/href="\/[^"]*utm_/);
  });

  it("escapes what the lifter typed", async () => {
    await createLink("acct-1", parseNew(body({ title: `<script>alert("x")</script>` })) as NewLink, NOW, "abcdefghij");
    const html = pageHtml(await getLink("abcdefghij"));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&#60;script&#62;");
  });

  it("says a deleted link is gone", () => {
    const gone = pageHtml(null);
    expect(gone).toContain("This link was removed");
    expect(gone).toContain('name="robots" content="noindex"');
    expect(gone).toContain('href="/exercises/"');
  });
});
