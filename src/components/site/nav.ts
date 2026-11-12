// The website's header links, in a plain module (no React) so the server-drawn public profile page
// (src/server/profilePage.ts) wears the same header as every other page.
import { localPath, type SiteLang } from "@/lib/siteLang";
import { siteText } from "@/locales/site";

export type NavLink = { href: string; label: string };

/**
 * The one header nav for every public page, the home page included (Melvin, 2026-11-11: the links used to change when you
 * left the home page). The home page's own sections are /#… links, so they work from any page. Wide screens show them
 * all; below lg they sit in the menu, beside Sign in and Start free.
 */
export function navFor(lang: SiteLang): NavLink[] {
  const n = siteText(lang).chrome.nav;
  // The home page and pricing are translated; the library, guides, blog and tools are English for now.
  return [
    { href: `${localPath(lang, "/")}#features`, label: n.features },
    { href: "/exercises/", label: n.exercises },
    { href: "/guides/", label: n.guides },
    { href: "/blog/", label: n.blog },
    { href: "/tools/", label: n.tools },
    { href: localPath(lang, "/pricing/"), label: n.pricing },
    { href: `${localPath(lang, "/")}#faq`, label: n.faq },
  ];
}
