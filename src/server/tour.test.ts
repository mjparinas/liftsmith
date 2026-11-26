import { describe, expect, it } from "vitest";

import { addDays, atTime, zoned } from "@/lib/messages";

import type { Send } from "./reminders";
import { nextTour, TOUR, tourMail, tourSteps } from "./tour";
import { NO_FACTS, queue, weeklyStart } from "./weekly/send";

const TZ = "America/Vancouver";
const MON = zoned(2026, 11, 9, 0, 0, TZ);
const DAY = 86_400_000;
const footer = { unsubscribeUrl: "https://example.com/u", postalAddress: "1 Main St" };
const send = (key: string, kind: Send["kind"], at: number, status: Send["status"] = "sent"): Send => ({
  subId: "s",
  key,
  kind,
  sendAt: at,
  resendId: null,
  status,
});

describe("the getting-started emails", () => {
  it("starts with the first step at 10:00 the day after the welcome", () => {
    const welcome = send("welcome", "welcome", atTime(MON, "19:00", TZ));
    // The run on Monday evening covers the next 26 hours: Tuesday at 10:00 is the first free morning.
    const t = nextTour([welcome], TZ, MON + 20 * 3600_000, MON + 46 * 3600_000);
    expect(t).toMatchObject({ key: "tour:plan", at: atTime(addDays(MON, 1, TZ), "10:00", TZ), n: 0 });
  });

  it("never the same day as another email, never two in a day, and in order", () => {
    const tue = addDays(MON, 1, TZ);
    const busy = [send("tour:plan", "tour", atTime(MON, "10:00", TZ)), send("reminder:x", "reminder", atTime(tue, "08:00", TZ))];
    expect(nextTour(busy, TZ, MON + 11 * 3600_000, tue + DAY - 1)).toBeNull();
    const wed = addDays(MON, 2, TZ);
    expect(nextTour(busy, TZ, tue + 11 * 3600_000, wed + DAY - 1)).toMatchObject({ key: "tour:why", n: 1 });
    // A tour email that stepped aside for another one is sent again later.
    const stepped = [...busy, send("tour:why", "tour", atTime(tue, "10:00", TZ), "cancelled")];
    expect(nextTour(stepped, TZ, tue + 11 * 3600_000, wed + DAY - 1)?.key).toBe("tour:why");
  });

  it("stops after the last step", () => {
    const all = TOUR.map((t, i) => send(`tour:${t.id}`, "tour", atTime(addDays(MON, i, TZ), "10:00", TZ)));
    expect(nextTour(all, TZ, addDays(MON, 20, TZ), addDays(MON, 21, TZ))).toBeNull();
  });

  it("is branded, in the reader's language, with the real screen and the unsubscribe link", () => {
    const m = tourMail({ step: TOUR[2], n: 2 }, footer, "de");
    expect(m.subject).toBe("Ein Tipp trägt den Satz ein");
    expect(m.html).toContain('src="https://www.getliftsmith.com/email/de/03.jpg"');
    expect(m.html).toContain("/icon-192.png");
    expect(m.text).toContain("Erste Schritte · 3 von 8");
    expect(m.text).toContain("https://example.com/u");
    expect(m.html).toContain("#/today");
  });

  // The Wear OS step (Melvin, 2026-11-26): waits for the wearOnPlay flag, and never reaches anyone already done.
  describe("the Wear OS step", () => {
    const ON = { wearOnPlay: true };
    const sentUpTo = (id: string) => {
      const ids = TOUR.filter((t) => !t.late).map((t) => t.id);
      return ids.slice(0, ids.indexOf(id) + 1).map((x, i) => send(`tour:${x}`, "tour", atTime(addDays(MON, i, TZ), "10:00", TZ)));
    };
    const after = (sends: Send[]) => addDays(MON, sends.length + 1, TZ);

    it("is skipped while Google Play hasn't approved the watch app", () => {
      const sends = sentUpTo("rest");
      expect(nextTour(sends, TZ, after(sends), after(sends) + DAY)).toMatchObject({ key: "tour:recovery", n: 5, total: 8 });
    });

    it("comes right after the rest timer once the flag is on, as tip 6 of 9, with the watch's screens", () => {
      const sends = sentUpTo("rest");
      const t = nextTour(sends, TZ, after(sends), after(sends) + DAY, ON)!;
      expect(t).toMatchObject({ key: "tour:watch", n: 5, total: 9 });
      const m = tourMail(t, footer, "en");
      expect(m.subject).toBe("Your workout on your Wear OS watch");
      expect(m.html).toContain('src="https://www.getliftsmith.com/email/en/09.jpg"');
      expect(m.text).toContain("Getting started · 6 of 9");
      expect(m.html).toContain("#/connections");
    });

    it("never reaches someone who finished Getting started before it, and doesn't hold up their weekly tips", () => {
      const done = sentUpTo("awards");
      expect(tourSteps(done, ON).map((t) => t.id)).not.toContain("watch");
      expect(nextTour(done, TZ, after(done), after(done) + 7 * DAY, ON)).toBeNull();
      expect(weeklyStart(done, true, MON, ON)).not.toBeNull();
      // They hear about it in the weekly tips instead, once the flag is on.
      const flags = { ...NO_FACTS.flags, wearOnPlay: true };
      const q = queue(new Set(), { roles: [], flags });
      expect(q.findIndex((e) => e.id === "watches")).toBeLessThan(q.findIndex((e) => !e.fresh));
      expect(queue(new Set(), NO_FACTS).some((e) => e.id === "watches")).toBe(false);
    });

    it("someone who got it isn't sent the weekly watch tip too, and their weekly tips wait for it", () => {
      const sends = [...sentUpTo("rest"), send("tour:watch", "tour", atTime(addDays(MON, 5, TZ), "10:00", TZ))];
      expect(weeklyStart(sends, true, MON, ON)).toBeNull();
      const flags = { coachPlans: false, wearOnPlay: true };
      expect(queue(new Set(["tour:watch"]), { roles: [], flags }).some((e) => e.id === "watches")).toBe(false);
      // Already sent: it stays in their series even if the flag goes off again.
      expect(tourSteps(sends, { wearOnPlay: false }).map((t) => t.id)).toContain("watch");
    });
  });
});
