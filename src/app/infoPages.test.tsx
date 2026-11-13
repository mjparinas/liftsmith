// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "@/components/site/ContactForm";
import { CONTACT_TOPICS } from "@/lib/contact";
import { ALL_FAQS, faqAnchor, FAQS, HELP, helpPath } from "@/lib/faqs";
import { checkFeedback, feedbackEmail } from "@/lib/feedbackServer";
import { PLAN_TABLE } from "@/lib/plans";
import { siteRoutes } from "@/lib/seo";
import { checkHealth } from "@/lib/status";
import { WHATS_NEW } from "@/lib/whatsNew";

import About from "./about/page";
import Accessibility from "./accessibility/page";
import Contact from "./contact/page";
import HelpTopic from "./help/[topic]/page";
import Help from "./help/page";
import Pricing from "./pricing/page";
import Status from "./status/page";
import Terms from "./terms/page";
import WhatsNew from "./whats-new/page";

// The site's plain pages, ported from Gradelings (Melvin, 2026-11-10).
const PAGES = [
  { path: "/terms/", Page: Terms, h1: "Terms of use" },
  { path: "/help/", Page: Help, h1: "Help and questions" },
  { path: "/contact/", Page: Contact, h1: "Contact us" },
  { path: "/pricing/", Page: Pricing, h1: "Pricing" },
  { path: "/whats-new/", Page: WhatsNew, h1: "What's new" },
  { path: "/status/", Page: Status, h1: "Service status" },
  { path: "/about/", Page: About, h1: "About Liftsmith" },
  { path: "/accessibility/", Page: Accessibility, h1: "Accessibility" },
];

const ok = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("info pages", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders each page with its title, the header and sticky calls to action, and a sitemap entry", () => {
    vi.stubGlobal("fetch", ok({ ok: true }));
    const paths = new Set(siteRoutes().map((r) => r.path));
    for (const { path, Page, h1 } of PAGES) {
      render(<Page />);
      expect(screen.getByRole("heading", { level: 1 }).textContent, path).toBe(h1);
      const ctas = [...document.querySelectorAll("[data-cta]")].map((a) => a.getAttribute("data-cta"));
      expect(ctas, path).toEqual(expect.arrayContaining(["header", `sticky-${path.slice(1, -1)}`]));
      expect(paths.has(path), path).toBe(true);
      cleanup();
    }
  });

  // next/link drops the trailing slash in tests; the build adds it back (trailingSlash).
  it("links every new page from the footer", () => {
    render(<Terms />);
    const footer = document.querySelector("footer")!;
    for (const { path } of PAGES) expect(footer.querySelector(`a[href="${path.slice(0, -1)}"]`), path).not.toBeNull();
  });

  it("lists every help question on /help/, linked to its answer on its topic page", () => {
    render(<Help />);
    for (const f of FAQS) expect(ALL_FAQS).toContainEqual(f);
    expect(new Set(ALL_FAQS.map((f) => f.q)).size).toBe(ALL_FAQS.length);
    expect(new Set(ALL_FAQS.map((f) => faqAnchor(f.q))).size).toBe(ALL_FAQS.length);
    const paths = new Set(siteRoutes().map((r) => r.path));
    for (const t of HELP) {
      expect(document.getElementById(t.id)).not.toBeNull();
      expect(paths.has(helpPath(t)), t.id).toBe(true);
      expect(t.blurb.length, t.id).toBeGreaterThanOrEqual(70);
      expect(t.blurb.length, t.id).toBeLessThanOrEqual(160);
      for (const f of t.faqs) {
        const link = screen.getByRole("link", { name: new RegExp(`^${f.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
        expect(link.getAttribute("href")).toBe(`${helpPath(t).slice(0, -1)}#${faqAnchor(f.q)}`);
      }
    }
  });

  it("puts each topic's answers on its own page, with FAQPage data for that topic only", async () => {
    for (const t of HELP) {
      render(await HelpTopic({ params: Promise.resolve({ topic: t.id }) }));
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t.title);
      for (const f of t.faqs) {
        expect(document.getElementById(faqAnchor(f.q))).not.toBeNull();
        expect(screen.getByText(f.a)).toBeTruthy();
      }
      const data = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((el) => JSON.parse(el.textContent!) as { "@type": string; mainEntity: unknown[] })
        .find((d) => d["@type"] === "FAQPage")!;
      expect(data.mainEntity, t.id).toHaveLength(t.faqs.length);
      cleanup();
    }
  });

  it("shows both plans and every row of the comparison table on the pricing page", () => {
    render(<Pricing />);
    expect(screen.getByRole("heading", { name: "Free" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /^Pro\b.+/ })).toBeTruthy();
    // The coach plans sit under the Pro card.
    expect(screen.getByRole("heading", { name: "Coach Plus" })).toBeTruthy();
    for (const g of PLAN_TABLE) for (const r of g.rows) expect(screen.getByRole("rowheader", { name: r.feature })).toBeTruthy();
    expect(document.body.textContent).toContain("$6.99");
    expect(document.body.textContent).toContain("$39.99");
  });

  it("lists what's new newest first, one entry per day", () => {
    const days = WHATS_NEW.map((d) => d.day);
    expect([...days].sort().reverse()).toEqual(days);
    expect(new Set(days).size).toBe(days.length);
    for (const d of WHATS_NEW) expect(d.items.length).toBeGreaterThan(0);
    render(<WhatsNew />);
    expect(screen.getByText("Monday, 9 November 2026")).toBeTruthy();
  });

  it("reads the health check as working, in trouble or unreachable", async () => {
    expect(await checkHealth(ok({ ok: true }))).toBe("ok");
    expect(await checkHealth(ok({ ok: false }, 503))).toBe("degraded");
    const down = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await checkHealth(down)).toBe("unreachable");
  });

  it("shows the live status once the check answers", async () => {
    vi.stubGlobal("fetch", ok({ ok: true }));
    render(<Status />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Everything is working" })).toBeTruthy());
  });
});

describe("contact form", () => {
  afterEach(cleanup);

  it("sends the message to the feedback route as a contact message the server accepts", async () => {
    const post = ok({ ok: true });
    render(<ContactForm fetcher={post} />);
    fireEvent.change(screen.getByLabelText("Your email"), { target: { value: "lifter@example.com" } });
    fireEvent.change(screen.getByLabelText("What it's about"), { target: { value: "billing" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Where do I see my receipt?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("lifter@example.com"));
    const [url, init] = (post as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]!;
    expect(url).toBe("/api/feedback/");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toMatchObject({ source: "contact", topic: "billing", kind: "other", email: "lifter@example.com" });
    const checked = checkFeedback(body);
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const mail = feedbackEmail(checked.item);
    expect(mail.subject).toBe("[Liftsmith Contact] Where do I see my receipt?");
    expect(mail.text).toContain("Topic: Pro, billing or a refund");
    expect(mail.text).not.toContain("chose not to include device details");
  });

  it("says what went wrong and keeps the message when sending fails", async () => {
    render(<ContactForm fetcher={ok({ error: "x" }, 429)} />);
    fireEvent.change(screen.getByLabelText("Your email"), { target: { value: "lifter@example.com" } });
    fireEvent.change(screen.getByLabelText("What it's about"), { target: { value: CONTACT_TOPICS[0]!.id } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Too many messages"));
    expect((screen.getByLabelText("Message") as HTMLTextAreaElement).value).toBe("Hello");
  });

  it("refuses a topic outside the list, or a topic on an in-app report", () => {
    const base = { id: "a", at: 1, kind: "other", message: "Hi", email: "a@b.co" };
    expect(checkFeedback({ ...base, source: "contact", topic: "spam" }).ok).toBe(false);
    expect(checkFeedback({ ...base, topic: "billing" }).ok).toBe(false);
    expect(checkFeedback({ ...base, source: "elsewhere" }).ok).toBe(false);
  });
});

describe("what's new credits lifters' asks", () => {
  it("marks an item lifters asked for, and only that one", async () => {
    const { NewsDayCard } = await import("@/components/site/WhatsNew");
    render(
      <NewsDayCard
        entry={{
          day: "2026-11-12",
          headline: "Two changes",
          items: [
            { kind: "new", title: "Asked", body: "Someone asked.", asked: true },
            { kind: "better", title: "Ours", body: "Our idea." },
          ],
        }}
      />,
    );
    expect(screen.getAllByText("You asked for this")).toHaveLength(1);
  });
});
