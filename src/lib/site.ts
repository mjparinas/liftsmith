export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getliftsmith.com";
export const APP_PATH = "/app/";
/** Privacy and support contact, shown on the privacy pages (Play and the App Store need one). */
export const CONTACT_EMAIL = "hello@getliftsmith.com";
/** The postal address in email footers (MAIL_POSTAL_ADDRESS in Vercel), also shown on /terms/ and /contact/ when set. */
export const MAILING_ADDRESS = process.env.MAIL_POSTAL_ADDRESS?.trim() || null;

/**
 * Store listings. A live URL makes that badge a link; without one the badge shows "Coming soon".
 * Google Play is live (2026-11-23); the App Store waits on iOS. `NEXT_PUBLIC_*` can override either.
 */
export const STORE_LINKS: { googlePlay: string | null; appStore: string | null } = {
  googlePlay: process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL || "https://play.google.com/store/apps/details?id=com.getliftsmith.app",
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL || null,
};
