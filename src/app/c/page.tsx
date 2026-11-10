import type { Metadata } from "next";

import { CreatorLanding } from "@/components/site/CreatorLanding";
import { SitePage } from "@/components/site/SiteChrome";

// A creator's link: www.getliftsmith.com/c/<code>/ (rewritten to this one page in next.config.ts) or /c/?code=.
// The code is read in the browser, so the page is the same for everyone and never indexed.
export const metadata: Metadata = { title: "A creator sent you", robots: { index: false, follow: false } };

export default function CreatorPage() {
  return (
    <SitePage kind="creator">
      <CreatorLanding />
    </SitePage>
  );
}
