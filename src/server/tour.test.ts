import { describe, expect, it } from "vitest";

import { addDays, atTime, zoned } from "@/lib/messages";

import type { Send } from "./reminders";
import { nextTour, TOUR, tourMail } from "./tour";

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
});
