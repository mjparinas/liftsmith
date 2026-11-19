// After a Settings search (settingsIndex.ts), the page that opens brings the picked setting into view and lights it up
// for a moment. The search hands over the setting's words; the page finds the element that shows exactly those words,
// so no setting needs an id of its own. docs/decisions/settings-screen.md "Search".

import { useEffect } from "react";

let pending: string | null = null;

/** Remember the words to look for on the next settings page that opens. */
export function jumpTo(label: string): void {
  pending = label;
}

/** The control a label belongs to: its card or section, so the whole setting is in view and lit. */
export function findSetting(root: ParentNode, label: string): HTMLElement | null {
  const want = label.trim();
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeValue?.trim() !== want) continue;
    const el = n.parentElement;
    if (el) return (el.closest(".card, section, [role=group]") as HTMLElement | null) ?? el;
  }
  return null;
}

/** On a settings page: scroll to the setting a search picked, and light it up (motion follows Lean mode). */
export function useSettingJump(): void {
  useEffect(() => {
    const label = pending;
    if (!label) return;
    // After the page has drawn (a timeout rather than a frame, which a hidden tab may never give).
    // `pending` is let go only here, so an effect run twice (React's strict mode) still finds it.
    const id = setTimeout(() => {
      pending = null;
      const el = findSetting(document.body, label);
      if (!el) return;
      el.scrollIntoView?.({ block: "center" });
      el.classList.remove("setting-hit");
      void el.offsetWidth;
      el.classList.add("setting-hit");
      setTimeout(() => el.classList.remove("setting-hit"), 1800);
    }, 0);
    return () => clearTimeout(id);
  }, []);
}
