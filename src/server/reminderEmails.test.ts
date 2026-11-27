import { describe, expect, it } from "vitest";

import { confirmMail, messageMail, welcomeMail } from "./reminderEmails";

const footer = { unsubscribeUrl: "https://example.com/u", postalAddress: "1 Main St" };

describe("reminder emails in the lifter's language", () => {
  it("English by default, with the unsubscribe link in the footer", () => {
    const m = welcomeMail(footer);
    expect(m.subject).toBe("Welcome to Liftsmith");
    expect(m.text).toContain("Unsubscribe from all Liftsmith emails: https://example.com/u");
    expect(m.html).toContain('<a href="https://example.com/u" style="color:#808c9d">Unsubscribe from all Liftsmith emails</a>');
  });

  it("Spanish and French for every part of the email", () => {
    expect(confirmMail("https://example.com/c", "es").subject).toBe("Confirma tus correos de Liftsmith");
    const fr = messageMail({ title: "T", body: "B", kind: "pro" }, footer, "fr");
    expect(fr.text).toContain("Voir Pro : ");
    expect(fr.text).toContain("Se désabonner de tous les e-mails Liftsmith : https://example.com/u");
    expect(fr.html).toContain(">Se désabonner de tous les e-mails Liftsmith</a>");
    expect(fr.text).toContain("essai et les offres Pro");
  });
});

describe("the branded layout", () => {
  const streak = { title: "Keep your streak", body: "3 workouts left this week to keep your 1-week streak.", kind: "streak" };

  it("a streak warning shows the flame, the weeks and this week's dots, in tables Gmail can't strip", () => {
    const m = messageMail({ ...streak, streak: { weeks: 1, done: 1, goal: 4 } }, footer, "en");
    expect(m.html).toContain("/email/icons/streak.png");
    expect(m.html).toContain("week streak");
    expect(m.html).toContain("1 of 4 workouts done this week");
    expect(m.html.match(/&#10003;<\/td>/g)).toHaveLength(1);
    expect(m.html.match(/dashed/g)).toHaveLength(3);
    expect(m.html).toContain('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#080b10"');
    // The number and its word stay together.
    expect(m.html).toContain("1‑week streak");
    expect(m.text).toContain("week streak: 1");
    expect(m.text).toContain("1-week streak");
  });

  it("other kinds get their icon tile and no streak card", () => {
    const m = messageMail({ title: "New best", body: "B", kind: "records" }, footer, "en");
    expect(m.html).toContain("/email/icons/trophy.png");
    expect(m.html).not.toContain("streak.png");
    expect(m.html).not.toContain("week streak");
  });

  it("the streak card's words come in every language", () => {
    const de = messageMail({ ...streak, streak: { weeks: 6, done: 3, goal: 5 } }, footer, "de");
    expect(de.html).toContain("Wochen-Serie");
    expect(de.html).toContain("3 von 5 Workouts diese Woche geschafft");
  });
});
