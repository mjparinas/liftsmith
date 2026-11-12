import { describe, expect, it } from "vitest";

import { ogFile } from "@/lib/ogImages";
import { siteRoutes } from "@/lib/seo";

import { ARTICLES } from "./articles";
import { BLOG_TOPICS, postsIn, topicOf, topicPath } from "./blogTopics";

describe("blog topics", () => {
  it("put every blog post in exactly one topic", () => {
    for (const a of ARTICLES.filter((x) => x.kind === "blog")) {
      const homes = BLOG_TOPICS.filter((t) => t.tags.includes(a.tag));
      expect(homes.length, `${a.slug} (${a.tag})`).toBe(1);
      expect(topicOf(a)).toBe(homes[0]);
    }
  });

  it("each list at least three posts, newest first", () => {
    for (const t of BLOG_TOPICS) {
      const posts = postsIn(t);
      expect(posts.length, t.slug).toBeGreaterThanOrEqual(3);
      expect(posts.map((p) => p.date)).toEqual([...posts.map((p) => p.date)].sort().reverse());
    }
  });

  it("have unique slugs, search-length titles and descriptions", () => {
    expect(new Set(BLOG_TOPICS.map((t) => t.slug)).size).toBe(BLOG_TOPICS.length);
    for (const t of BLOG_TOPICS) {
      expect(t.title.length, t.slug).toBeLessThanOrEqual(60);
      expect(t.description.length, t.slug).toBeGreaterThanOrEqual(70);
      expect(t.description.length, t.slug).toBeLessThanOrEqual(160);
    }
  });

  it("are in the sitemap with their own preview card", () => {
    const paths = new Set(siteRoutes().map((r) => r.path));
    for (const t of BLOG_TOPICS) {
      expect(paths.has(topicPath(t)), t.slug).toBe(true);
      expect(ogFile(topicPath(t))).toBe(`blog-topics/${t.slug}.jpg`);
    }
  });
});
