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
