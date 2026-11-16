"use client";

// Sets <html lang> for a page that isn't in English (the root layout writes lang="en" for the whole static site), and
// puts English back when the lifter moves on to an English page. Reading a page in another language also remembers it,
// so the web app's first visit starts in that language (siteLang.ts, `readSiteLang`).
import { useEffect } from "react";

import { isSiteLang, rememberSiteLang } from "@/lib/siteLang";

export function DocLang({ lang }: { lang: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const before = html.lang;
    html.lang = lang;
    if (isSiteLang(lang)) rememberSiteLang(lang);
    return () => {
      html.lang = before || "en";
    };
  }, [lang]);
  return null;
}
