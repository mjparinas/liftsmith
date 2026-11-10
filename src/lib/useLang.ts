import { useSyncExternalStore } from "react";

import { currentLang, subscribeLang, type Lang } from "./i18n";

// Kept out of i18n.ts so the public site's server components can import the exercise library (types.ts
// uses i18n) without pulling in a client-only React hook.

/** Re-renders a component when the language changes. Returns the language. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, currentLang, () => "en");
}
