import Link from "next/link";
import { APP_PATH, STORE_LINKS } from "@/lib/site";

// Google Play and App Store badges in the stores' standard black style. Until a listing exists
// (STORE_LINKS in src/lib/site.ts), the badge is shown dimmed with "Coming soon" and isn't a link,
// and a link to the web app sits beside them so nobody hits a dead end.
// TODO before launch: swap these drawn badges for the official artwork from Apple's and Google's badge
// pages (the cloud session that built them couldn't reach either site).

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path fill="#4285F4" d="M3.6 1.8 13.5 12l-9.9 10.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" />
      <path fill="#34A853" d="M3.6 1.8c.3-.2.8-.2 1.2.1l11.9 6.8-3.2 3.3z" />
      <path fill="#EA4335" d="m13.5 12 3.2 3.3-11.9 6.8c-.4.3-.9.3-1.2.1z" />
      <path fill="#FBBC04" d="m16.7 8.7 3.7 2.1c.9.5.9 1.9 0 2.4l-3.7 2.1-3.2-3.3z" />
    </svg>
  );
}

function Badge({ href, store, small, big, logo, cta }: { href: string | null; store: string; small: string; big: string; logo: React.ReactNode; cta: string }) {
  const body = (
    <>
      {logo}
      <span className="flex flex-col leading-none">
        <span className="text-[0.625rem] font-medium tracking-wide">{small}</span>
        <span className="mt-0.5 text-[1.1875rem] font-semibold tracking-tight">{big}</span>
      </span>
    </>
  );
  const cls = "inline-flex h-[52px] min-w-[164px] items-center gap-2.5 rounded-[10px] border border-[#a6a6a6] bg-black px-3.5 text-white";
  if (href)
    return (
      <a href={href} className={`press ${cls}`} data-cta={cta} rel="noopener">
        {body}
      </a>
    );
  return (
    <span className="relative inline-flex" role="img" aria-label={`${store}: coming soon`}>
      <span className={`${cls} opacity-60`} aria-hidden>
        {body}
      </span>
      <span aria-hidden className="absolute -top-2 -right-2 rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-bold text-accent-ink uppercase">
        Soon
      </span>
    </span>
  );
}

/** `place` names where the badges sit, so the beacon counts each placement separately. */
export function StoreBadges({ className = "", webLink = true, place }: { className?: string; webLink?: boolean; place: string }) {
  const soon = !STORE_LINKS.googlePlay || !STORE_LINKS.appStore;
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <Badge href={STORE_LINKS.googlePlay} store="Google Play" small="GET IT ON" big="Google Play" logo={<PlayLogo />} cta={`google-play-${place}`} />
      <Badge href={STORE_LINKS.appStore} store="App Store" small="Download on the" big="App Store" logo={<AppleLogo />} cta={`app-store-${place}`} />
      {webLink && soon && (
        <Link href={APP_PATH} className="text-sm font-semibold text-accent underline-offset-4 hover:underline" data-cta={`open-app-${place}`}>
          The apps are coming soon. Use it in your browser today →
        </Link>
      )}
    </div>
  );
}
