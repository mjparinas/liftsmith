"use client";

// Sets <html lang> for a page that isn't in English (the root layout writes lang="en" for the whole static site), and
// puts English back when the lifter moves on to an English page.
import { useEffect } from "react";

export function DocLang({ lang }: { lang: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const before = html.lang;
    html.lang = lang;
    return () => {
      html.lang = before || "en";
    };
  }, [lang]);
  return null;
}
